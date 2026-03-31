#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'date'

STANDARDS_DIR = '_data/standards'
POSTS_DIR = '_posts'

GROUP_NAMES = {
  'wg2' => 'WG 2',
  'wg4' => 'e-Documents',
  'wg5' => 'Date and time',
  'wg6' => 'Trusted eCommunications',
  'wg7' => 'Digital Business',
  'jwg1' => 'JWG 1',
  'jwg8' => 'JWG 8',
  'jwg9' => 'JWG 9',
  'iso7372ma' => 'ISO 7372/MA'
}.freeze

PUBLISHED_STAGES = %w[60.60 90.93].freeze
WITHDRAWN_STAGES = %w[95.99].freeze

def needs_post?(standard_data)
  iso = standard_data['iso'] || {}
  tc154 = standard_data['tc154'] || {}

  return false unless tc154['group']

  stage = iso['stage'].to_s
  return false if WITHDRAWN_STAGES.include?(stage)
  return false if stage.empty? || stage.start_with?('10.') || stage.start_with?('20.') || stage.start_with?('30.') || stage.start_with?('40.') || stage.start_with?('50.')

  true
end

def post_exists?(standard_id, iso_name, posts_dir)
  # ISO 8601-1 and 8601-2 share a joint post
  return :joint if iso_name =~ /^ISO 8601-1:2019$/ || iso_name =~ /^ISO 8601-2:2019$/

  # Check by standard ID path
  return true if Dir.glob("#{posts_dir}/*.adoc").any? do |path|
    File.read(path).include?("/standards/#{standard_id}")
  end

  false
end

# Extract ISO standard number for filename
# "ISO 8601-1:2019" -> "8601-1-2019"
# "ISO 8601-1:2019/Amd 1:2022" -> "8601-1-2019-amd-1-2022"
# "ISO 9735-10:2022" -> "9735-10-2022"
# "ISO/TR 16340:2023" -> "tr-16340-2023"
def extract_iso_number(iso_name)
  # Remove ISO prefix and any following separators
  name = iso_name.sub(/^ISO[\s.\/-]*[\/]?/i, '').sub(/^\//, '').sub(/^-/, '')

  # Handle amendments: "8601-1:2019/Amd 1:2022" -> include amendment in filename
  if name.include?('/')
    parts = name.split('/')
    base = parts[0].strip  # "8601-1:2019"
    amendment = parts[1].strip  # "Amd 1:2022"
    # Normalize amendment: "Amd 1:2022" -> "amd-1-2022"
    amd_normalized = amendment.gsub(' ', '-').gsub(':', '-')
    base_parts = base.split(':')
    "#{base_parts[0]}-#{base_parts[1]}-#{amd_normalized}"
  else
    # No amendment
    # Normalize the name (replace spaces, colons with dashes, lowercase)
    parts = name.split(':')
    if parts.length >= 2
      "#{parts[0].gsub(' ', '-').downcase}-#{parts[1]}"
    else
      name.gsub(' ', '-').downcase
    end
  end
end

# Derive publication year from ISO name when date is missing
# e.g., "ISO 34000:2023" -> 2023, "ISO 8601-1:2019/Amd 1:2025" -> 2025
def derive_year_from_iso_name(iso_name)
  # Match year at end: ISO 9735-10:2022, ISO 8601-1:2019/Amd 1:2025
  if iso_name =~ /\d{4}\s*$/
    iso_name.scan(/\d{4}/).last.to_i
  elsif iso_name =~ /Amd.*?(\d{4})/
    $1.to_i
  else
    nil
  end
end

def generate_post_filename(iso_name, publication_date)
  iso_num = extract_iso_number(iso_name)
  date = if publication_date.is_a?(Date)
    publication_date
  elsif publication_date.is_a?(String)
    Date.parse(publication_date)
  else
    year = derive_year_from_iso_name(iso_name)
    year ? Date.new(year, 1, 1) : Date.new(2000, 1, 1)
  end
  date_str = date.strftime('%Y-%m-%d')
  "#{date_str}-iso-#{iso_num}.adoc"
end

def is_amendment?(iso_name)
  iso_name.include?('Amd') || iso_name.include?('Amendment') || iso_name.include?('Corr')
end

def generate_post_content(standard_id, standard_data, post_filename)
  iso = standard_data['iso']
  tc154 = standard_data['tc154']

  iso_name = iso['name']
  group_id = tc154['group']
  group_name = GROUP_NAMES[group_id] || group_id
  # Extract date from filename: 2023-01-01-iso-34000.adoc -> 2023-01-01
  pub_date = post_filename.sub(/^(\d{4}-\d{2}-\d{2})-.*$/, '\1')

  verb = is_amendment?(iso_name) ? 'published as an amendment' : 'published'

  <<~CONTENT
    ---
    layout: post
    title:  #{iso_name} #{verb}!
    date:   #{pub_date} 00:00:00 +0800
    categories: site update
    see_also:
    ---

    link:/standards/#{standard_id}[#{iso_name}] has been #{verb}
    as an International Standard, and will be available on ISO.org soon.

    // more

    Congratulations to link:/groups/#{group_id}[#{group_name}] on this excellent
    achievement!
  CONTENT
end

def update_yaml_related_news(yaml_path, post_filename, iso_name)
  yaml = YAML.safe_load(File.read(yaml_path), permitted_classes: [Date])
  post_url = "/posts/#{post_filename.gsub('.adoc', '')}"
  yaml['tc154'] ||= {}
  yaml['tc154']['related_news'] = "* link:#{post_url}[ISO/TC 154 news: #{iso_name} published!]"
  File.write(yaml_path, YAML.dump(yaml, indent: 2, line_width: -1))
end

def main
  puts "Generating news posts for ISO/TC 154 standards..."

  Dir.glob("#{STANDARDS_DIR}/*.yml").sort.each do |yaml_path|
    id = File.basename(yaml_path, '.yml')
    data = YAML.safe_load(File.read(yaml_path), permitted_classes: [Date])
    next unless data && data['iso']

    iso_name = data['iso']['name'] || 'Unknown'

    unless needs_post?(data)
      puts "SKIP: #{iso_name} (no post needed)"
      next
    end

    existing = post_exists?(id, iso_name, POSTS_DIR)
    if existing == :joint
      puts "SKIP: #{iso_name} (shares joint post with ISO 8601-2)"
      next
    elsif existing
      puts "SKIP: #{iso_name} (post already exists)"
      next
    end

    pub_date = data['iso']['publication_date']
    filename = generate_post_filename(iso_name, pub_date)
    post_path = File.join(POSTS_DIR, filename)

    if File.exist?(post_path)
      n = 2
      n += 1 while File.exist?(File.join(POSTS_DIR, "#{filename.gsub('.adoc', '')}-#{n}.adoc"))
      filename = "#{filename.gsub('.adoc', '')}-#{n}.adoc"
      post_path = File.join(POSTS_DIR, filename)
    end

    File.write(post_path, generate_post_content(id, data, filename))
    puts "CREATED: #{filename}"

    update_yaml_related_news(yaml_path, filename, iso_name)
    puts "UPDATED: #{id}.yml"
  end
end

main