#!/usr/bin/env ruby
# frozen_string_literal: true

# Sync ISO Open Data for TC 154.
#
# Uses the official ISO Open Data dataset:
#   https://www.iso.org/open-data.html
#
# This script downloads the ISO Deliverables Metadata JSONL once and performs
# two phases in a single pass:
#
#   Phase 1 (sync): for every local YAML in _data/standards/, match by iso.name
#     to a TC 154 deliverable and fill in missing iso.store_id, iso.stage,
#     iso.ics, iso.publication_date. Never overwrites tc154.* or existing
#     iso.* values.
#
#   Phase 2 (discover): for every TC 154 deliverable with no matching local
#     YAML, append an entry to scripts/.new-standards.json (consumed by the
#     workflow to open GitHub issues) and generate a placeholder YAML file
#     if one with the derived slug doesn't yet exist.
#
# Usage: ruby scripts/sync_iso_open_data.rb
# Exits 0 if no changes, 1 if any YAML was modified or created.

require 'yaml'
require 'json'
require 'date'
require 'open-uri'
require 'set'

STANDARDS_DIR   = '_data/standards'
ISO_DATA_URL    = 'https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_deliverables_metadata/json/iso_deliverables_metadata.jsonl'
OWNER_COMMITTEE = 'ISO/TC 154'
MANIFEST_PATH   = 'scripts/.new-standards.json'

# ─── Stage formatting ─────────────────────────────────────────────────────────
# ISO Open Data uses integer stage codes: 6060 → "60.60", 9599 → "95.99"

def format_stage(code)
  return nil unless code.is_a?(Integer) && code > 0
  main = code / 100
  sub  = code % 100
  format('%<main>d.%<sub>02d', main: main, sub: sub)
end

# Map an ISO stage code to a TC 154 site status.
#   < 60.00        → under_development
#   60.00 .. 95.20 → published (includes systematic review at 90.20)
#   >= 95.99       → withdrawn
def status_from_stage(stage)
  return 'under_development' if stage.nil? || stage.to_s.empty?
  normalized = stage.to_s.sub('.', '').to_i
  return 'under_development' if normalized < 6000
  return 'withdrawn'         if normalized >= 9599
  'published'
end

# ISO reference prefix → deliverable type used by the site's `iso.type` field.
# Searches anywhere in the reference so prefixes like "ISO/AWI TR …" or
# "ISO/NP TS …" still resolve correctly.
def type_from_reference(ref)
  case ref.to_s
  when /\b(FD)?TS\b/, /\bDTS\b/  then 'TS'
  when /\b(FD)?TR\b/, /\bDTR\b/  then 'TR'
  else 'international'
  end
end

# ISO Open Data returns titles as { en: …, fr: … }; the site expects a string.
def extract_title(raw)
  return '(title pending)' unless raw
  return raw.to_s unless raw.is_a?(Hash)
  en = raw['en']
  return en if en && !en.to_s.empty?
  fr = raw['fr']
  return fr if fr && !fr.to_s.empty? && !fr.to_s.downcase.include?('titre manque')
  raw.values.find { |v| v && !v.to_s.empty? } || '(title pending)'
end

# "ISO/AWI 7372" → "iso-awi-7372"
# "ISO 8601-1:2019" → "iso-8601-1-2019"
# "ISO 9735:1988/Amd 1:1992" → "iso-9735-1988-amd-1-1992"
def slugify(ref)
  ref.to_s
     .downcase
     .gsub(/[^a-z0-9]+/, '-')
     .gsub(/^-+|-+$/, '')
end

# Whether `ref` is a D-stage deliverable — DIS, DTR, DTS, FDIS, FDTR, FDTS,
# PRF (and final-draft amendments/corrigenda). At this stage ISO Open Data
# appends a ".N" iteration counter to indicate which circulation of the
# draft the record represents (e.g. ISO/DTR 20180.2 = 2nd DTR circulation).
# Plain published types (IS, TR, TS) are intentionally excluded — those have
# no draft iterations.
D_STAGE_PATTERN = /\b((?:FD|D)(?:IS|TR|TS)|PRF|FDAMD|FDCOR)\b/

def d_stage?(ref)
  D_STAGE_PATTERN.match?(ref.to_s)
end

# Normalize references so two forms of the same deliverable match:
#   * Amd/Cor dashes: "ISO 9735:1988/Amd-1:1992" ↔ "ISO 9735:1988/Amd 1:1992"
#   * D-stage iteration suffix: "ISO/DTR 20180.2" ↔ "ISO/DTR 20180"
#     Only stripped for D-stage refs (DIS/DTR/DTS/FDIS/FDTR/FDTS/PRF), where
#     ".N" is the circulation counter. Other stages (PWI, NP, AWI, WD, CD)
#     use ".N" with different semantics, so we leave it intact.
def normalize_ref(ref)
  s = ref.to_s.gsub(/([Aa]md|[Cc]or)\s*-\s*(\d)/, '\1 \2')
  return s unless d_stage?(s)
  s.gsub(/\.(\d+)$/, '')
end

# ─── YAML helpers ─────────────────────────────────────────────────────────────

def load_yaml(path)
  YAML.safe_load(File.read(path), permitted_classes: [Date])
rescue StandardError => e
  warn "  WARN: #{path}: #{e.message[0..80]}"
  nil
end

def save_yaml(path, data)
  File.write(path, YAML.dump(data, indent: 2, line_width: -1))
end

def iso_field_missing?(existing, field)
  val = existing.dig('iso', field.to_sym) || existing.dig('iso', field.to_s)
  val.nil? || val.to_s.empty?
end

# All references already covered by local YAML, plus their normalized forms.
def existing_references
  refs = Set.new
  Dir.glob("#{STANDARDS_DIR}/*.yml").each do |path|
    d = load_yaml(path)
    next unless d && d['iso']
    name = d['iso']['name']
    next unless name && !name.empty?
    refs << name
    normalized = normalize_ref(name)
    refs << normalized if normalized != name
  end
  refs
end

def existing_slugs
  Set.new(Dir.glob("#{STANDARDS_DIR}/*.yml").map { |f| File.basename(f, '.yml') })
end

# ─── Fetch ISO Open Data ──────────────────────────────────────────────────────

def fetch_tc154_deliverables
  puts "Downloading ISO Open Data from #{ISO_DATA_URL}…"
  tc154 = {}
  unique = {}
  URI.open(ISO_DATA_URL, 'Accept' => 'application/json', read_timeout: 120) do |f|
    f.each_line do |line|
      begin
        j = JSON.parse(line)
      rescue JSON::ParserError
        next
      end
      next unless j['ownerCommittee'] == OWNER_COMMITTEE
      ref = j['reference']
      next unless ref && !ref.empty?
      normalized = normalize_ref(ref)
      tc154[normalized] = j
      unique[normalized] = j
    end
  end
  puts "  Found #{unique.size} deliverables for #{OWNER_COMMITTEE} (#{tc154.size} reference forms)"
  tc154
end

# ─── Phase 1: sync metadata for existing standards ────────────────────────────

def sync_existing(tc154)
  changes = []
  Dir.glob("#{STANDARDS_DIR}/*.yml").sort.each do |yaml_path|
    existing = load_yaml(yaml_path)
    next unless existing && existing['iso']

    iso = existing['iso']
    iso_name = iso['name']
    next if iso_name.nil? || iso_name.empty?

    deliverable = tc154[iso_name] || tc154[normalize_ref(iso_name)]
    unless deliverable
      puts "  #{iso_name}: no match in ISO Open Data" if $VERBOSE
      next
    end

    updated = false
    store_id = deliverable['id']
    stage    = format_stage(deliverable['currentStage'])
    ics_raw  = deliverable['icsCode']
    ics      = ics_raw && !Array(ics_raw).empty? ? Array(ics_raw).join(', ') : nil
    pub_date = deliverable['publicationDate']

    if store_id && iso_field_missing?(existing, 'store_id')
      existing['iso']['store_id'] = store_id
      puts "  #{iso_name}: store_id → #{store_id}"
      updated = true
    end
    if stage && iso_field_missing?(existing, 'stage')
      existing['iso']['stage'] = stage
      puts "  #{iso_name}: stage → #{stage}"
      updated = true
    end
    if ics && iso_field_missing?(existing, 'ics')
      existing['iso']['ics'] = ics
      puts "  #{iso_name}: ics → #{ics}"
      updated = true
    end
    if pub_date && iso_field_missing?(existing, 'publication_date')
      existing['iso']['publication_date'] = pub_date
      puts "  #{iso_name}: publication_date → #{pub_date}"
      updated = true
    end

    next unless updated

    save_yaml(yaml_path, existing)
    changes << iso_name
  end
  changes
end

# ─── Phase 2: discover standards with no local YAML ───────────────────────────

def build_placeholder(deliverable)
  raw_ref = deliverable['reference']
  ref     = normalize_ref(raw_ref)
  stage   = format_stage(deliverable['currentStage'])
  ics_raw = deliverable['icsCode']
  ics     = ics_raw && !Array(ics_raw).empty? ? Array(ics_raw).join(', ') : nil

  iso = {
    'name'  => ref,
    'type'  => type_from_reference(ref),
    'title' => extract_title(deliverable['title']),
  }
  iso['stage']            = stage                          if stage
  iso['publication_date'] = deliverable['publicationDate'] if deliverable['publicationDate']
  iso['ics']              = ics                            if ics
  iso['store_id']         = deliverable['id']              if deliverable['id']

  { 'iso' => iso, 'tc154' => { 'status' => status_from_stage(stage) } }
end

def discover_new(tc154, refs, slugs)
  manifest         = []
  new_placeholders = []

  tc154.keys.sort.each do |ref|
    next if refs.include?(ref) || refs.include?(normalize_ref(ref))

    deliverable = tc154[ref]
    raw_ref     = deliverable['reference']
    slug        = slugify(ref)
    placeholder = build_placeholder(deliverable)
    already     = slugs.include?(slug)

    manifest << {
      reference:          raw_ref,
      title:              extract_title(deliverable['title']),
      stage:              placeholder['iso']['stage'],
      status:             placeholder.dig('tc154', 'status'),
      type:               placeholder['iso']['type'],
      ics:                placeholder['iso']['ics'],
      store_id:           deliverable['id'],
      publication_date:   deliverable['publicationDate'],
      iso_store_url:      deliverable['id'] ? "https://www.iso.org/standard/#{deliverable['id']}.html" : nil,
      slug:               slug,
      yaml_path:          "#{STANDARDS_DIR}/#{slug}.yml",
      placeholder_created: !already,
    }

    if already
      puts "  · Placeholder already exists: #{slug}.yml  (#{raw_ref})"
    else
      save_yaml("#{STANDARDS_DIR}/#{slug}.yml", placeholder)
      new_placeholders << slug
      puts "  + Created placeholder:       #{slug}.yml  (#{raw_ref})"
    end
  end

  File.write(MANIFEST_PATH, JSON.pretty_generate(manifest))
  puts "\nPhase 2 — discover: #{manifest.size} unmatched deliverables, #{new_placeholders.size} new placeholder(s)"
  new_placeholders
end

# ─── Main ─────────────────────────────────────────────────────────────────────

def main
  tc154 = fetch_tc154_deliverables

  puts "\nPhase 1 — sync metadata for existing standards"
  sync_changes = sync_existing(tc154)

  puts "\nPhase 2 — discover new deliverables"
  discover_count = discover_new(tc154, existing_references, existing_slugs).size

  total_changes = sync_changes.size + discover_count
  if total_changes.zero?
    puts "\nNo changes — exiting 0."
    exit 0
  else
    puts "\n#{total_changes} change(s): #{sync_changes.size} metadata update(s), #{discover_count} new placeholder(s)."
    puts "Exiting 1 (changes made — GHA will create PR)."
    exit 1
  end
end

main
