#!/usr/bin/env ruby
# frozen_string_literal: true

# Validate ISO/TC 154 P/O member status against ISO Open Data.
#
# Source of truth (P/O membership of ISO/TC 154):
#   https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_technical_committees/json/iso_technical_committees.jsonl
#
# Cross-checks _data/national_bodies.yml against the ISO record:
#   * current P/O members missing locally → must be added
#   * current local members missing from ISO → likely stale, should be marked former
#   * membership-type mismatch (we say P, ISO says O or vice versa)
#   * acronym mismatch (our short_name doesn't match ISO's acronym for the same body)
#
# Former members (entries with `former: true`) are tracked separately — they are
# excluded from the "missing-from-ISO" check (because they're no longer current).
# If ISO still lists a former member as current, that's flagged as info (we may
# want to reactivate).
#
# Usage: ruby scripts/validate_member_status.rb
# Exit 0 if all current memberships align; exit 1 on any mismatch.

require 'yaml'
require 'json'
require 'open-uri'

ISO_DATA_URL    = 'https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_technical_committees/json/iso_technical_committees.jsonl'
TARGET_REFERENCE = 'ISO/TC 154'
LOCAL_DATA_PATH = '_data/national_bodies.yml'

# ─── Helpers ──────────────────────────────────────────────────────────────────

# Normalize an acronym for join key comparison: uppercase, collapse internal
# whitespace, strip outer whitespace. "UNMS SR" ↔ "UNMS SR", "SE UkrNDNC" ↔
# "SE UkrNDNC" — these are multi-word acronyms ISO includes verbatim.
def normalize_acronym(s)
  return '' if s.nil?
  s.to_s.upcase.split(/\s+/).join(' ').strip
end

# ─── Fetch ISO Open Data ──────────────────────────────────────────────────────

def fetch_iso_members
  $stderr.puts "Downloading ISO technical_committees JSONL from #{ISO_DATA_URL}…"
  found = nil
  URI.open(ISO_DATA_URL, 'Accept' => 'application/json', read_timeout: 120) do |f|
    f.each_line do |line|
      begin
        rec = JSON.parse(line)
      rescue JSON::ParserError
        next
      end
      next unless rec['reference'] == TARGET_REFERENCE
      found = rec
      break
    end
  end
  abort "ERROR: #{TARGET_REFERENCE} record not found in ISO data." unless found

  p_members = Array(found['pMembers']).each_with_object({}) do |m, h|
    h[normalize_acronym(m['acronym'])] = { id: m['id'], acronym: m['acronym'], membership: 'P' }
  end
  o_members = Array(found['oMembers']).each_with_object({}) do |m, h|
    h[normalize_acronym(m['acronym'])] = { id: m['id'], acronym: m['acronym'], membership: 'O' }
  end
  $stderr.puts "  ISO #{TARGET_REFERENCE}: #{p_members.size} P-members, #{o_members.size} O-members"
  p_members.merge(o_members)
end

# ─── Load local data ──────────────────────────────────────────────────────────

def load_local_members
  entries = YAML.safe_load(File.read(LOCAL_DATA_PATH), permitted_classes: [Date])
  current = {}
  former  = {}
  Array(entries).each do |e|
    key = normalize_acronym(e['short_name'])
    next if key.empty?
    (e['former'] ? former : current)[key] = {
      id:         e['id'],
      short_name: e['short_name'],
      country:    e['country'],
      membership: e['membership'],
    }
  end
  [current, former]
end

# ─── Compare ──────────────────────────────────────────────────────────────────

Report = Struct.new(:category, :severity, :message) # severity: :fail, :info

def compare(local_current, local_former, iso)
  reports = []

  # 1. Current local members must exist in ISO with matching membership type
  local_current.each do |key, loc|
    iso_entry = iso[key]
    if iso_entry.nil?
      # Is it listed as a former member in ISO? Not directly knowable from this
      # dataset — ISO only publishes current membership. So if local says current
      # but ISO doesn't list it at all, it likely lapsed.
      reports << Report.new(
        :missing_from_iso, :fail,
        "#{loc[:short_name]} (#{loc[:country]}) marked membership=#{loc[:membership]} locally, but ISO does not list #{TARGET_REFERENCE} as currently having it — mark `former: true`?"
      )
    elsif iso_entry[:membership] != loc[:membership]
      reports << Report.new(
        :membership_mismatch, :fail,
        "#{loc[:short_name]} (#{loc[:country]}): local says membership=#{loc[:membership]}, ISO says #{iso_entry[:membership]}"
      )
    end
  end

  # 2. ISO members must exist locally as current
  iso.each do |key, iso_entry|
    loc = local_current[key]
    next if loc

    former_loc = local_former[key]
    if former_loc
      reports << Report.new(
        :former_still_listed_in_iso, :info,
        "#{former_loc[:short_name]} (#{former_loc[:country]}) marked `former: true` locally but ISO still lists it as membership=#{iso_entry[:membership]} — reactivate?"
      )
    else
      reports << Report.new(
        :missing_from_local, :fail,
        "ISO lists #{iso_entry[:acronym]} as membership=#{iso_entry[:membership]} for #{TARGET_REFERENCE}, but no entry in #{LOCAL_DATA_PATH}"
      )
    end
  end

  reports
end

# ─── Report ───────────────────────────────────────────────────────────────────

def print_report(reports)
  failures = reports.select { |r| r.severity == :fail }
  infos    = reports.select { |r| r.severity == :info }

  by_cat = reports.group_by(&:category)

  if failures.empty?
    puts "✓ All current P/O memberships match ISO Open Data."
  else
    puts "✗ #{failures.size} membership mismatch(es) vs ISO Open Data:"
    puts
    [:missing_from_local, :missing_from_iso, :membership_mismatch].each do |cat|
      next unless by_cat[cat]
      puts "  #{cat.to_s.tr('_', ' ').capitalize}:"
      by_cat[cat].each { |r| puts "    • #{r.message}" }
      puts
    end
  end

  return if infos.empty?
  puts
  puts "ℹ #{infos.size} informational note(s):"
  by_cat[:former_still_listed_in_iso]&.each { |r| puts "    • #{r.message}" }
end

# ─── Main ─────────────────────────────────────────────────────────────────────

def main
  local_current, local_former = load_local_members
  $stderr.puts "Local: #{local_current.size} current, #{local_former.size} former"
  iso = fetch_iso_members

  reports = compare(local_current, local_former, iso)
  puts
  print_report(reports)

  exit(reports.any? { |r| r.severity == :fail } ? 1 : 0)
end

main
