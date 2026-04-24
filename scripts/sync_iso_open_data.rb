#!/usr/bin/env ruby
# frozen_string_literal: true

# Sync ISO Open Data for standards in _data/standards/
#
# Uses the official ISO Open Data dataset:
#   https://www.iso.org/open-data.html
#
# This script:
#   1. Downloads the ISO Deliverables Metadata JSONL from Azure Blob Storage
#   2. Finds all deliverables owned by ISO/TC 154
#   3. Matches them to local YAML files by reference (iso.name)
#   4. Updates: store_id, stage, ics, publication_date
#   5. Never overwrites tc154.* fields or existing iso.* values
#
# Usage: ruby scripts/sync_iso_open_data.rb
# Exits 0 if no changes, 1 if YAML files were modified.

require 'yaml'
require 'json'
require 'date'
require 'open-uri'

STANDARDS_DIR = '_data/standards'
ISO_DATA_URL = 'https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_deliverables_metadata/json/iso_deliverables_metadata.jsonl'
OWNER_COMMITTEE = 'ISO/TC 154'

# ─── Stage formatting ─────────────────────────────────────────────────────────
# ISO Open Data uses integer stage codes: 6060 → "60.60", 9599 → "95.99"

def format_stage(code)
  return nil unless code.is_a?(Integer) && code > 0
  main = code / 100
  sub = code % 100
  "#{main}.#{sub.to_s.rjust(2, '0')}"
end

# ─── YAML helpers ─────────────────────────────────────────────────────────────

def load_yaml(path)
  YAML.safe_load(File.read(path), permitted_classes: [Date])
rescue StandardError => e
  puts "  WARN: #{path}: #{e.message[0..80]}"
  nil
end

def save_yaml(path, data)
  File.write(path, YAML.dump(data, indent: 2, line_width: -1))
end

def iso_field_missing?(existing, field)
  val = existing.dig('iso', field.to_sym) || existing.dig('iso', field.to_s)
  val.nil? || val.to_s.empty?
end

# ─── Fetch ISO Open Data ──────────────────────────────────────────────────────

def fetch_tc154_deliverables
  puts "Downloading ISO Open Data from #{ISO_DATA_URL}..."
  tc154 = {}

  URI.open(ISO_DATA_URL, 'Accept' => 'application/json', :read_timeout => 120) do |f|
    f.each_line do |line|
      begin
        j = JSON.parse(line)
      rescue JSON::ParserError
        next
      end
      next unless j['ownerCommittee'] == OWNER_COMMITTEE

      ref = j['reference']
      tc154[ref] = j
    end
  end

  puts "  Found #{tc154.size} deliverables for #{OWNER_COMMITTEE}"
  tc154
end

# ─── Main ─────────────────────────────────────────────────────────────────────

def main
  tc154 = fetch_tc154_deliverables
  changes = []

  Dir.glob("#{STANDARDS_DIR}/*.yml").sort.each do |yaml_path|
    existing = load_yaml(yaml_path)
    next unless existing && existing['iso']

    iso = existing['iso']
    iso_name = iso['name']
    next if iso_name.nil? || iso_name.empty?

    # Match by iso.name → deliverable reference
    # Try exact match first, then try normalizing spaces around dashes
    deliverable = tc154[iso_name]
    unless deliverable
      # Try normalizing reference (e.g. "ISO 9735:1988/Amd-1:1992" → "ISO 9735:1988/Amd 1:1992")
      normalized = iso_name.gsub(/([Aa]md|[Cc]or)\s*-\s*(\d)/, '\1 \2')
      deliverable = tc154[normalized]
    end

    updated = false

    if deliverable
      store_id = deliverable['id']
      stage = format_stage(deliverable['currentStage'])
      ics_raw = deliverable['icsCode']
      ics = Array(ics_raw).join(', ') if ics_raw
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
    else
      puts "  #{iso_name}: no match in ISO Open Data" if $VERBOSE
    end

    next unless updated

    save_yaml(yaml_path, existing)
    changes << iso_name
  end

  # Report unmatched deliverables (useful for discovering new standards)
  matched_refs = Dir.glob("#{STANDARDS_DIR}/*.yml").map do |f|
    d = load_yaml(f)
    d&.dig('iso', 'name')
  end.compact.to_set

  unmatched = tc154.keys.reject { |ref| matched_refs.include?(ref) }
  unless unmatched.empty?
    puts "\n  Note: #{unmatched.size} deliverables in ISO Open Data have no matching YAML file:"
    unmatched.sort.each { |ref| puts "    #{ref}" }
  end

  if changes.empty?
    puts "\nNo changes — exiting 0."
    exit 0
  else
    puts "\n#{changes.size} file(s) updated: #{changes.join(', ')}"
    puts "Exiting 1 (changes made — GHA will create PR)."
    exit 1
  end
end

require 'set'
main
