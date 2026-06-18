#!/usr/bin/env ruby
# frozen_string_literal: true

# Update member YAML files with group membership role records
# based on the raw member lists in member-list-raw/
#
# Usage: ruby scripts/update_group_membership.rb

require 'csv'

MEMBERS_DIR = '_data/members'

# ─── Name-to-slug mapping (simple, no YAML loading) ────────────────────────

def build_name_to_slug_map
  map = {}
  Dir.glob("#{MEMBERS_DIR}/*.yaml").each do |f|
    slug = File.basename(f, '.yaml')
    name_line = nil
    File.foreach(f) do |line|
      if line =~ /^name:\s*(.+)/
        name_line = $1.strip
        break
      end
    end
    next unless name_line

    map[name_line.downcase] = slug

    # "First Last" → "Last, First"
    parts = name_line.split(' ', 2)
    if parts.size == 2
      map["#{parts[1]}, #{parts[0]}".downcase] = slug
    end

    # Multi-word: "First Middle Last" → "Last, First Middle"
    all_parts = name_line.split
    if all_parts.size >= 2
      last = all_parts.last
      rest = all_parts[0...-1].join(' ')
      map["#{last}, #{rest}".downcase] = slug
    end
  end
  map
end

def lookup_slug(name_to_slug, raw_name)
  normalized = raw_name.strip

  slug = name_to_slug[normalized.downcase]
  return slug if slug

  # Try swapping "Last, First" → "First Last"
  if normalized.include?(',')
    parts = normalized.split(',', 2).map(&:strip)
    swapped = "#{parts[1]} #{parts[0]}"
    slug = name_to_slug[swapped.downcase]
    return slug if slug
  end

  nil
end

# ─── Parse raw member list (MD format, 7-line repeating) ──────────────────

def parse_md_member_list(filepath)
  lines = File.readlines(filepath).map(&:chomp)
  members = []

  i = 0
  while i < lines.size
    role = lines[i]&.strip
    if role == 'Committee member'
      name = lines[i + 3]&.strip
      members << name if name && !name.empty?
      i += 7
    else
      i += 1
    end
  end

  members
end

# ─── Parse raw member list (CSV format) ────────────────────────────────────

def parse_csv_member_list(filepath)
  members = []
  CSV.read(filepath, headers: true).each do |row|
    role = row['Role']&.strip
    name = row['Last name, First name']&.strip
    if role == 'Committee member' && name && !name.empty?
      members << name
    end
  end
  members
end

# ─── Check if member already has a role for this group ─────────────────────

def has_member_role?(slug, group_id)
  filepath = "#{MEMBERS_DIR}/#{slug}.yaml"
  return false unless File.exist?(filepath)

  # Simple text search: look for "group: <group_id>" near "id: member"
  content = File.read(filepath)
  content =~ /^(\s*)- id: member\n(\1)\s+group: #{group_id}$/
end

# ─── Add role record to member YAML file ───────────────────────────────────

def add_role_to_member(slug, group_id)
  filepath = "#{MEMBERS_DIR}/#{slug}.yaml"
  return false unless File.exist?(filepath)
  return false if has_member_role?(slug, group_id)

  content = File.read(filepath)
  lines = content.lines

  # Find the roles: line
  roles_idx = lines.index { |l| l.strip.start_with?('roles:') }
  unless roles_idx
    # No roles section — create one before 'active:' or at the end
    active_idx = lines.index { |l| l.strip.start_with?('active:') }
    insert_idx = active_idx || lines.size
    lines.insert(insert_idx, "roles:\n", "  - id: member\n    group: #{group_id}\n")
    File.write(filepath, lines.join)
    return true
  end

  # Determine indent of existing role entries
  indent = nil
  (roles_idx + 1...lines.size).each do |idx|
    if lines[idx] =~ /^(\s*)- id:/
      indent = Regexp.last_match(1)
      break
    end
  end
  indent ||= '  '

  # Find end of roles section
  last_role_idx = roles_idx
  role_depth = indent.size
  (roles_idx + 1...lines.size).each do |idx|
    line = lines[idx]
    stripped = line.rstrip
    next if stripped.empty?

    current_indent = line.length - line.lstrip.length
    # A line with indent <= role_depth that starts a new key = end of roles
    if current_indent < role_depth && line.match?(/^\s*\w/)
      break
    end
    last_role_idx = idx
  end

  # Insert new role
  new_lines = "#{indent}- id: member\n#{indent}  group: #{group_id}\n"
  lines.insert(last_role_idx + 1, new_lines)
  File.write(filepath, lines.join)
  true
end

# ─── Main ──────────────────────────────────────────────────────────────────

def main
  name_to_slug = build_name_to_slug_map

  group_files = {
    'jwg1' => { file: 'member-list-raw/JWG1-members.md', format: :md },
    'jwg9' => { file: 'member-list-raw/JWG9-members.md', format: :md },
    'wg2'  => { file: 'member-list-raw/WG2-members.md', format: :md },
    'wg5'  => { file: 'member-list-raw/members_iso-tc-154-wg-5-3.csv', format: :csv },
    'wg6'  => { file: 'member-list-raw/WG6-members.md', format: :md },
    'wg7'  => { file: 'member-list-raw/WG7-members.md', format: :md },
  }

  # Exclude leadership (they're shown via convenors/managers, not members)
  group_leadership = {
    'jwg1' => ['anders-grangard', 'gregor-roschkowski'],
    'jwg9' => ['jim-wilson', 'yan-zhang'],
    'wg2'  => ['glenn-tice'],
    'wg5'  => ['ronald-tse'],
    'wg6'  => ['jasmine-chang'],
    'wg7'  => ['jim-wilson'],
  }

  total_added = 0
  new_members = {}

  group_files.each do |group_id, info|
    raw_names = info[:format] == :csv ? parse_csv_member_list(info[:file]) : parse_md_member_list(info[:file])
    leadership = group_leadership[group_id] || []
    added = 0
    unresolved = []

    puts "\n== #{group_id.upcase} (#{raw_names.size} committee members)"

    raw_names.each do |raw_name|
      slug = lookup_slug(name_to_slug, raw_name)

      unless slug
        unresolved << raw_name
        new_members[raw_name] ||= []
        new_members[raw_name] << group_id unless new_members[raw_name].include?(group_id)
        next
      end

      next if leadership.include?(slug)

      if add_role_to_member(slug, group_id)
        puts "  + #{slug} → #{group_id}"
        added += 1
      end
    end

    total_added += added
    puts "  Added: #{added}, Skipped: #{raw_names.size - added - unresolved.size}"

    unless unresolved.empty?
      puts "  Unresolved:"
      unresolved.each { |n| puts "    - #{n}" }
    end
  end

  puts "\n== Total roles added: #{total_added}"

  unless new_members.empty?
    puts "\n  New members needed (#{new_members.size}):"
    new_members.each { |name, groups| puts "    #{name} → #{groups.join(', ')}" }
  end
end

main
