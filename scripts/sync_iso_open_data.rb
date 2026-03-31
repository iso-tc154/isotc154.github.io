#!/usr/bin/env ruby
# frozen_string_literal: true

# Sync ISO Open Data for standards in _data/standards/
#
# ISO.org has no public API. Store IDs are required to scrape standard pages.
# This script:
#   1. Infers missing iso.ics from standard series patterns (reliable, no network needed)
#   2. Scrapes iso.org for iso.stage when a store_id is known (requires manual setup)
#   3. Never overwrites tc154.* fields or existing iso.* values
#
# To enable iso.org scraping for your standards:
#   1. Look up each standard at https://www.iso.org/standard/<id>.html to find its store ID
#   2. Add it to the STORE_IDS hash below
#   3. Commit — the GHA will then keep stage data current
#
# Usage: ruby scripts/sync_iso_open_data.rb
# Exits 0 if no changes, 1 if YAML files were modified.

require 'yaml'
require 'date'

STANDARDS_DIR = '_data/standards'

# ─── ICS inference ─────────────────────────────────────────────────────────────
# ICS (International Classification for Standards) codes are stable per series.
# Source: ISO MRTD guidelines + iso.org standard pages.

ICS_PATTERNS = {
  /^ISO 9735/         => '35.240.63',  # EDIFACT
  /^ISO\/TS 15000/    => '35.240.63',
  /^ISO 15000/        => '35.240.63',
  /^ISO 17369/        => '35.240.63',  # Supply chain
  /^ISO 23354/        => '35.240.63',
  /^ISO 23355/        => '35.240.63',
  /^ISO 23356/        => '35.240.63',
  /^ISO 8601/         => '01.140.30',  # Date/time
  /^ISO 34000/        => '01.040.01',  # Vocabularies
  /^ISO 20415/        => '35.240.63',  # e-Documents
  /^ISO 14533/        => '35.240.63',  # Long term signature
  /^ISO 20197/        => '35.240.63',
  /^ISO 6422/         => '35.240.63',
  /^ISO 5054/         => '35.240.63',
  /^ISO 22468/        => '35.240.63',
  /^ISO 5909/         => '35.240.63',
  /^ISO 7372/         => '01.140.30',  # UNTDED
  /^ISO\/TR 16340/   => '01.140.30',
  /^ISO\/TR 16320/   => '01.140.30',
  /^ISO 19626/        => '35.240.63',
  /^ISO 11180/        => '01.140.30',
  /^ISO 8439/         => '35.240.63',
  /^ISO 8440/         => '35.240.63',
}.freeze

def infer_ics(iso_name)
  ICS_PATTERNS.each do |pattern, ics|
    return ics if iso_name.to_s.match?(pattern)
  end
  nil
end

# ─── ISO.org scraping ────────────────────────────────────────────────────────
# iso.org has no public API. Store IDs must be added manually.
# Find the store ID for a standard by searching iso.org for the standard name,
# then note the number in the resulting URL (e.g. /standard/68620.html).
#
# Add confirmed store IDs here:
STORE_IDS = {
  # 'ISO 34000:2023'          => 68620,
  # 'ISO 8601-1:2019'         => 70965,
  # 'ISO 8601-2:2019'         => 70975,
  # 'ISO 20415:2019'           => xxxxx,
  # 'ISO 23354:2020'           => xxxxx,
}.freeze

begin
  require 'open-uri'
  require 'nokogiri'
  HAVE_NET = true
rescue LoadError
  HAVE_NET = false
end

USER_AGENT = 'Mozilla/5.0 (compatible; ISO-TC154-Bot/1.0; +https://www.isotc154.org/bot)'

# Fetch stage and publication date from an iso.org standard page.
# Returns {} on failure.
def fetch_iso_metadata(store_id)
  return {} unless HAVE_NET && store_id

  url = "https://www.iso.org/standard/#{store_id}.html"
  doc = Nokogiri::HTML(
    URI.open(url, 'User-Agent' => USER_AGENT, 'Timeout' => 10)
  )

  data = {}

  doc.css('script[type="application/ld+json"]').each do |script|
    (JSON.parse(script.text)['@graph'] || [JSON.parse(script.text)]).each do |item|
      next unless item['@type'] == 'Product'
      data['publication_date'] = item['productionDate']
      stage_prop = item.dig('additionalProperty')&.find { |p| p['name'] == 'Publication stage' }
      data['stage'] = stage_prop&.dig('value')&.match(/(\d+\.\d+)/)&.[](1)
    end
  rescue JSON::ParserError
    # Not JSON or wrong format — try next script block
  end

  # Fallback: meta tags
  if data.empty?
    doc.css('meta').each do |meta|
      case meta['property']
      when 'article:published_time'
        data['publication_date'] = meta['content']
      end
    end
    doc.css('[data-stage]').each do |el|
      data['stage'] = el['data-stage'] if el['data-stage'] =~ /^\d+\.\d+$/
    end
  end

  data
rescue StandardError => e
  puts "    fetch failed: #{e.class} #{e.message[0..60]}"
  {}
end

# ─── YAML helpers ────────────────────────────────────────────────────────────

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

# ─── Main ────────────────────────────────────────────────────────────────────

def main
  puts "ISO Open Data sync starting..."
  puts "  #{STORE_IDS.size} store IDs configured, #{HAVE_NET ? 'network available' : 'network not available'}"
  changes = []

  Dir.glob("#{STANDARDS_DIR}/*.yml").sort.each do |yaml_path|
    id = File.basename(yaml_path, '.yml')
    existing = load_yaml(yaml_path)
    next unless existing && existing['iso']

    iso = existing['iso']
    iso_name = iso['name']
    next if iso_name.nil? || iso_name.empty?

    updated = false

    # 1. Infer missing ICS code from series
    if iso_field_missing?(existing, 'ics')
      ics = infer_ics(iso_name)
      if ics
        existing['iso']['ics'] = ics
        puts "  #{iso_name}: inferred ics → #{ics}"
        updated = true
      end
    end

    # 2. Scrape iso.org for stage (when store ID is known)
    store_id = STORE_IDS[iso_name]
    if store_id && iso_field_missing?(existing, 'stage')
      print "  #{iso_name}: scraping iso.org store #{store_id}... "
      metadata = fetch_iso_metadata(store_id)
      if metadata['stage']
        existing['iso']['stage'] = metadata['stage']
        puts "stage → #{metadata['stage']}"
        updated = true
      else
        puts "no stage data found"
      end
    end

    next unless updated

    save_yaml(yaml_path, existing)
    changes << iso_name
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

main
