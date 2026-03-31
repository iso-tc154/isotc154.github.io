#!/usr/bin/env ruby
# frozen_string_literal: true

# Validates all Jekyll data files against schemas/schema.yaml
# Usage: ruby scripts/validate_yaml.rb

require 'yaml'
require 'pathname'
require 'date'

SCHEMA_FILE = Pathname.new(__dir__).parent.join('schemas', 'schema.yaml').freeze
DEFS = YAML.safe_load(SCHEMA_FILE.read, permitted_classes: [], permitted_symbols: [], aliases: true)['$defs']

# ── Stage enum ────────────────────────────────────────────────────────────────

STAGES = %w[PWI NP WD WDS CD CDTS DIS IS DTS DTR DAM FDIS AWI].freeze
ROLE_IDS = %w[chair convenor manager member committee_manager technical_programme_manager editorial_programme_manager technical-programme-manager editorial-programme-manager project_leader observer partner].freeze
DOC_TYPES = %w[international TS TR].freeze
GROUP_STATUSES = %w[withdrawn under_development deleted].freeze
LIAISON_CATEGORIES = %w[A B].freeze
PROJECT_STATUSES = %w[new current].freeze
DATE_PRECISIONS = %w[year month day].freeze

# ── Helpers ──────────────────────────────────────────────────────────────────

def err(msg, file)
  "#{file}: #{msg}"
end

def present?(val)
  !val.nil? && val != ''
end

def valid_date?(val)
  return true if val.is_a?(Date)
  return false unless val.is_a?(String)
  val =~ /^\d{4}-\d{2}-\d{2}$/ && !Date.parse(val).nil?
rescue ArgumentError
  false
end

def valid_slug?(str)
  str.is_a?(String) && str =~ /\A[a-z0-9]+(-[0-9]+)*\z/
end

# ── Validators ───────────────────────────────────────────────────────────────

def validate_project(data, file)
  errors = []
  errors << err("missing required field: id", file) unless present?(data['id'])
  errors << err("id must be a slug (e.g. iso-15000-5)", file) if present?(data['id']) && !valid_slug?(data['id'])
  errors << err("missing required field: name", file) unless present?(data['name'])
  errors << err("missing required field: title", file) unless present?(data['title'])
  errors << err("missing required field: status", file) unless present?(data['status'])
  errors << err("status must be one of: #{PROJECT_STATUSES.join(', ')}", file) if present?(data['status']) && !PROJECT_STATUSES.include?(data['status'])
  errors << err("missing required field: stage", file) unless present?(data['stage'])
  errors << err("stage must be one of: #{STAGES.join(', ')}", file) if present?(data['stage']) && !STAGES.include?(data['stage'])
  errors
end

def validate_group(data, file)
  errors = []
  errors << err("missing required field: id", file) unless present?(data['id'])
  errors << err("missing required field: _id", file) unless present?(data['_id'])
  errors << err("missing required field: name", file) unless present?(data['name'])
  errors << err("missing required field: title", file) unless present?(data['title'])
  errors << err("missing required field: order", file) unless present?(data['order'])
  errors << err("order must be an integer", file) if present?(data['order']) && !data['order'].is_a?(Integer)
  errors << err("inactive must be a boolean", file) if data.key?('inactive') && !data['inactive'].is_a?(TrueClass) && !data['inactive'].is_a?(FalseClass)
  errors << err("featured_on_home must be a boolean", file) if data.key?('featured_on_home') && !data['featured_on_home'].is_a?(TrueClass) && !data['featured_on_home'].is_a?(FalseClass)
  errors << err("active_projects must be an array", file) if data.key?('active_projects') && !data['active_projects'].is_a?(Array)
  errors << err("standards must be an array", file) if data.key?('standards') && !data['standards'].is_a?(Array)
  if data['organization']
    errors << err("organization.convenors must be an array", file) if data['organization'].key?('convenors') && !data['organization']['convenors'].is_a?(Array)
    errors << err("organization.managers must be an array", file) if data['organization'].key?('managers') && !data['organization']['managers'].is_a?(Array)
  end
  if data['history']
    errors << err("history.leadership must be an array", file) if data['history'].key?('leadership') && !data['history']['leadership'].is_a?(Array)
  end
  if data['collaborative_parties']
    data['collaborative_parties'].each_with_index do |cp, i|
      errors << err("collaborative_parties[#{i}].entity_name required", file) unless present?(cp['entity_name'])
    end
  end
  errors
end

def validate_role(role, role_index, file)
  errors = []
  id_val = role['id']
  # id can be a string or, if YAML parses it as a date, a Date object
  id_str = id_val.is_a?(String) ? id_val : (id_val.respond_to?(:to_s) ? id_val.to_s : nil)
  errors << err("roles[#{role_index}].id required", file) if id_str.nil? || id_str.empty?
  errors << err("roles[#{role_index}].id must be one of: #{ROLE_IDS.join(', ')}", file) if id_str && !ROLE_IDS.include?(id_str)
  if role['from']
    errors << err("roles[#{role_index}].from.date required", file) unless role['from']['date']
    errors << err("roles[#{role_index}].from.date must be a valid date (YYYY-MM-DD)", file) if role['from']['date'] && !valid_date?(role['from']['date'])
    errors << err("roles[#{role_index}].from.precision required", file) unless present?(role['from']['precision'])
    errors << err("roles[#{role_index}].from.precision must be one of: #{DATE_PRECISIONS.join(', ')}", file) if present?(role['from']['precision']) && !DATE_PRECISIONS.include?(role['from']['precision'])
  end
  if role['to']
    errors << err("roles[#{role_index}].to.date required", file) unless role['to']['date']
    errors << err("roles[#{role_index}].to.date must be a valid date (YYYY-MM-DD)", file) if role['to']['date'] && !valid_date?(role['to']['date'])
    errors << err("roles[#{role_index}].to.precision required", file) unless present?(role['to']['precision'])
    errors << err("roles[#{role_index}].to.precision must be one of: #{DATE_PRECISIONS.join(', ')}", file) if present?(role['to']['precision']) && !DATE_PRECISIONS.include?(role['to']['precision'])
  end
  errors
end

def validate_link(link, link_index, file)
  errors = []
  errors << err("links[#{link_index}].url required", file) unless present?(link['url'])
  errors << err("links[#{link_index}].title required", file) unless present?(link['title'])
  errors
end

def validate_member(data, file)
  errors = []
  errors << err("missing required field: member-id", file) unless present?(data['member-id'])
  errors << err("missing required field: name", file) unless present?(data['name'])
  errors << err("active must be a boolean", file) if data.key?('active') && !data['active'].is_a?(TrueClass) && !data['active'].is_a?(FalseClass)
  errors << err("roles is required and must be a non-empty array", file) unless data['roles'].is_a?(Array) && !data['roles'].empty?
  if data['roles'].is_a?(Array)
    data['roles'].each_with_index do |role, i|
      errors.concat(validate_role(role, i, file))
    end
  end
  if data['links']
    errors << err("links must be an array", file) unless data['links'].is_a?(Array)
    data['links'].each_with_index { |link, i| errors.concat(validate_link(link, i, file)) } if data['links'].is_a?(Array)
  end
  errors
end

def validate_standard(data, file)
  errors = []
  errors << err("iso is required", file) unless data['iso'].is_a?(Hash)
  if data['iso'].is_a?(Hash)
    iso = data['iso']
    errors << err("iso.name required", file) unless present?(iso['name'])
    errors << err("iso.type required", file) unless present?(iso['type'])
    errors << err("iso.type must be one of: #{DOC_TYPES.join(', ')}", file) if present?(iso['type']) && !DOC_TYPES.include?(iso['type'])
    errors << err("iso.title required", file) unless present?(iso['title'])
    errors << err("iso.stage required", file) unless present?(iso['stage'])
  end
  errors << err("tc154 is required", file) unless data['tc154'].is_a?(Hash)
  if data['tc154'].is_a?(Hash)
    tc154 = data['tc154']
    errors << err("tc154.group required", file) unless present?(tc154['group'])
    errors << err("tc154.status must be one of: #{GROUP_STATUSES.join(', ')}", file) if tc154.key?('status') && !GROUP_STATUSES.include?(tc154['status'])
  end
  errors
end

def validate_liaison(entry, index, file)
  errors = []
  errors << err("[entry #{index + 1}]: id required", file) unless present?(entry['id'])
  errors << err("[entry #{index + 1}]: name required", file) unless present?(entry['name'])
  errors << err("[entry #{index + 1}]: short_name required", file) unless present?(entry['short_name'])
  errors << err("[entry #{index + 1}]: category required", file) unless present?(entry['category'])
  errors << err("[entry #{index + 1}]: category must be one of: #{LIAISON_CATEGORIES.join(', ')}", file) if present?(entry['category']) && !LIAISON_CATEGORIES.include?(entry['category'])
  errors << err("[entry #{index + 1}]: description required", file) unless present?(entry['description'])
  errors
end

def validate_national_body(entry, index, file)
  errors = []
  errors << err("[entry #{index + 1}]: id required", file) unless present?(entry['id'])
  errors << err("[entry #{index + 1}]: name required", file) unless present?(entry['name'])
  errors << err("[entry #{index + 1}]: short_name required", file) unless present?(entry['short_name'])
  errors << err("[entry #{index + 1}]: iso_country_code required", file) unless entry.key?('iso_country_code')
  if entry.key?('iso_country_code') && entry['iso_country_code'] != false
    code = entry['iso_country_code']
    errors << err("[entry #{index + 1}]: iso_country_code must be a 2-letter ISO code or false", file) if !code.is_a?(String) || code !~ /^[A-Z]{2}$/
  end
  errors << err("[entry #{index + 1}]: logo required", file) unless present?(entry['logo'])
  errors << err("[entry #{index + 1}]: description required", file) unless present?(entry['description'])
  errors
end

def validate_secretariat_entry(entry, index, file)
  errors = []
  errors << err("[entry #{index + 1}]: role required", file) unless present?(entry['role'])
  valid_roles = ['Committee Manager', 'Technical Programme Manager']
  errors << err("[entry #{index + 1}]: role must be one of: #{valid_roles.join(', ')}", file) if present?(entry['role']) && !valid_roles.include?(entry['role'])
  errors
end

# ── File loaders ─────────────────────────────────────────────────────────────

def glob_files(pattern)
  Pathname.new(Dir.pwd).glob(pattern).sort
end

def extract_frontmatter(content)
  m = content.match(/\A---\n(.*?)\n---/m)
  m ? m[1] : nil
end

def parse_yaml(content, file_path)
  YAML.safe_load(content, permitted_classes: [Date, DateTime], permitted_symbols: [], aliases: true)
rescue YAML::SyntaxError => e
  raise "#{file_path}: YAML syntax error: #{e.message}"
end

# ── Main ─────────────────────────────────────────────────────────────────────

ALL_ERRORS = []

[
  ['Groups', '_data/groups/*.yml', method(:validate_group)],
  ['Members', '_data/members/*.yaml', method(:validate_member)],
  ['Standards', '_data/standards/*.yml', method(:validate_standard)],
  ['Liaisons', '_data/liaisons.yml', nil],
  ['National Bodies', '_data/national_bodies.yml', nil],
  ['Secretariat', '_data/secretariat.yml', nil],
  ['Projects', '_projects/*.adoc', nil],
].each do |label, pattern, validator|
  puts "Validating #{label}..."
  files = pattern.include?('*') ? glob_files(pattern) : [Pathname.new(pattern)]

  if label == 'Liaisons'
    next unless files[0]&.exist?
    entries = parse_yaml(files[0].read, files[0])
    entries.each_with_index { |e, i| ALL_ERRORS.concat(validate_liaison(e, i, files[0])) }
    puts "  ✓ Liaisons — #{entries.size} entries validated"
    next
  end

  if label == 'National Bodies'
    next unless files[0]&.exist?
    entries = parse_yaml(files[0].read, files[0])
    entries.each_with_index { |e, i| ALL_ERRORS.concat(validate_national_body(e, i, files[0])) }
    puts "  ✓ National Bodies — #{entries.size} entries validated"
    next
  end

  if label == 'Secretariat'
    next unless files[0]&.exist?
    entries = parse_yaml(files[0].read, files[0])
    entries.each_with_index { |e, i| ALL_ERRORS.concat(validate_secretariat_entry(e, i, files[0])) }
    puts "  ✓ Secretariat — #{entries.size} entries validated"
    next
  end

  if label == 'Projects'
    files.each do |file|
      fm = extract_frontmatter(file.read)
      if fm.nil?
        ALL_ERRORS << "#{file}: no frontmatter found"
        next
      end
      data = parse_yaml(fm, "#{file} frontmatter")
      ALL_ERRORS.concat(validate_project(data, file))
    end
    puts "  ✓ Projects — #{files.size} files validated"
    next
  end

  next if files.empty?
  file_errors = 0
  files.each do |file|
    data = parse_yaml(file.read, file)
    e = validator.call(data, file)
    if e.empty?
      puts "  ✓ #{file.basename}"
    else
      e.each { |err| puts "    ✗ #{err}" }
      ALL_ERRORS.concat(e)
      file_errors += 1
    end
  end
  puts "  #{files.size - file_errors}/#{files.size} files valid"
end

puts
if ALL_ERRORS.empty?
  puts 'All files passed validation.'
  exit 0
else
  puts "#{ALL_ERRORS.size} total error(s)."
  exit 1
end
