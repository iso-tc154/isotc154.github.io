#!/usr/bin/env ruby
# Normalizes the `affiliation:` field in all _data/members/*.yaml files
# to match the short_name format from _data/liaisons.yml and _data/national_bodies.yml.
#
# Canonical format:
#   National body: "{short_name}, {country}"
#   Liaison:       "{short_name}"
#
# Run with:  ruby scripts/normalize_affiliations.rb
# Dry run:   ruby scripts/normalize_affiliations.rb --dry-run
# Verbose:   ruby scripts/normalize_affiliations.rb --verbose

require 'yaml'
require 'fileutils'

DRY_RUN   = ARGV.include?('--dry-run') || ARGV.include?('-n')
VERBOSE   = ARGV.include?('--verbose') || ARGV.include?('-v')

MEMBERS_DIR = '_data/members'
NB_FILE     = '_data/national_bodies.yml'
LIA_FILE    = '_data/liaisons.yml'

# ── Load org data ────────────────────────────────────────────────────────────

nb = YAML.safe_load(File.read(NB_FILE), permitted_classes: [Date, Symbol, Time])
lia = YAML.safe_load(File.read(LIA_FILE), permitted_classes: [Date, Symbol, Time])

# Build lookup tables
id_to_info    = {}   # id -> { short_name, type: 'nb'|'liaison' }
short_to_id   = {}   # short_name.downcase -> id  (case-insensitive)
short_to_info = {}   # short_name.downcase -> info  (for validation)

nb.each do |o|
  next unless o['id'] && o['short_name']
  info = { short_name: o['short_name'], type: 'nb', id: o['id'], country: nil }
  id_to_info[o['id']]    = info
  short_to_id[o['short_name'].downcase]  = o['id']
  short_to_info[o['short_name'].downcase] = info
end

lia.each do |o|
  next unless o['id'] && o['short_name']
  info = { short_name: o['short_name'], type: 'liaison', id: o['id'] }
  id_to_info[o['id']]    = info
  short_to_id[o['short_name'].downcase]  = o['id']
  short_to_info[o['short_name'].downcase] = info
end

# ── Country lookup for national bodies ───────────────────────────────────────
# Maps org id -> canonical country name used in affiliations
COUNTRY_FOR = {
  'sac'       => 'China',
  'din'       => 'Germany',
  'bsi'       => 'United Kingdom',
  'jisc'      => 'Japan',
  'kats'      => 'Korea, Republic of',
  'snv'       => 'Switzerland',
  'iss'       => 'Serbia',
  'gost'      => 'Russian Federation',
  'uni'       => 'Italy',
  'ilnas'     => 'Luxembourg',
  'inso'      => 'Iran',
  'itchkstar' => 'Hong Kong, China',
  'kebs'      => 'Kenya',
  'mszt'      => 'Hungary',
  'nen'       => 'Netherlands',
  'nzso'      => 'New Zealand',
  'sist'      => 'Slovenia',
  'sn'        => 'Norway',
  'ssc'       => 'Sweden',
  'stameq'    => 'Albania',
  'asro'      => 'Romania',
  'asi'       => 'Austria',
  'une'       => 'Spain',
  'unms'      => 'Slovakia',
  'belst'     => 'Belarus',
  'se-ukrndnc'=> 'Ukraine',
  'ds'        => 'Denmark',
  'bis'       => 'India',
  'bds'       => 'Bulgaria',
  'sas'       => 'Saudi Arabia',
}

# ── Compute canonical affiliation for a given org id ──────────────────────────

def canonical_aff(id, id_to_info, country_for)
  info = id_to_info[id]
  return nil unless info

  if info[:type] == 'liaison'
    # Liaisons: just short_name, no country/suffix
    info[:short_name]
  else
    # National bodies: short_name, country
    country = country_for[id]
    country ? "#{info[:short_name]}, #{country}" : info[:short_name]
  end
end

# ── Normalize a single affiliation string ─────────────────────────────────────

def normalize_aff(aff, short_to_id, short_to_info, id_to_info, country_for)
  return nil, nil unless aff

  parts = aff.split(',', 2)
  prefix = parts[0].strip
  rest   = parts[1] ? parts[1].strip : nil

  # Normalize hyphens to spaces to handle orgs like 'se-ukrndnc' vs 'SE UkrNDNC'
  normalized_prefix = prefix.gsub('-', ' ')

  # Case-insensitive match of prefix against known org short_names
  org_id = short_to_id[normalized_prefix.downcase]
  return nil, nil unless org_id

  expected = canonical_aff(org_id, id_to_info, country_for)
  current_ok = (aff == expected)

  return expected, current_ok
end

# ── Process all member files ──────────────────────────────────────────────────

files = Dir.glob(File.join(MEMBERS_DIR, '*.yaml')).sort

updated   = 0
skipped   = 0
unmatched = []

files.each do |filepath|
  filename = File.basename(filepath)
  m = YAML.safe_load(File.read(filepath), permitted_classes: [Date, Symbol, Time])
  next unless m.is_a?(Hash) && m['affiliation']

  member_id = m['member-id'] || m['id'] || filename.gsub('.yaml','')
  aff = m['affiliation']
  next unless aff && aff.to_s.strip != ''

  expected, current_ok = normalize_aff(aff, short_to_id, short_to_info, id_to_info, COUNTRY_FOR)

  if current_ok
    skipped += 1
    puts "[OK]   #{member_id}: '#{aff}'" if VERBOSE
    next
  end

  if expected.nil?
    unmatched << [member_id, aff]
    puts "[??]   #{member_id}: '#{aff}' — no matching org in national_bodies.yml or liaisons.yml"
    next
  end

  # Need to update
  puts "[->]   #{member_id}: '#{aff}' → '#{expected}'"

  unless DRY_RUN
    m['affiliation'] = expected
    File.write(filepath, m.to_yaml(line_width: -1))
  end

  updated += 1
end

# ── Summary ───────────────────────────────────────────────────────────────────

puts
puts "─── Summary ───────────────────────────────────────────"
puts "  Files checked : #{files.size}"
puts "  Already OK    : #{skipped}"
puts "  Updated      : #{updated}#{' (dry-run)' if DRY_RUN}"
puts "  Unmatched    : #{unmatched.size}"
unmatched.each { |mid, aff| puts "    #{mid}: '#{aff}'" }

if unmatched.any? && !DRY_RUN
  puts
  puts "Tip: Add missing organizations to _data/national_bodies.yml or"
  puts "     _data/liaisons.yml, then re-run this script."
end
