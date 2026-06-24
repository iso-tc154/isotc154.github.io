#!/usr/bin/env ruby
# frozen_string_literal: true
# Adds or refreshes the `# yaml-language-server: $schema=...` pointer at the
# top of each data YAML so editors get hover/autocomplete from schemas/schema.yaml.
# Idempotent: re-running updates stale pointers and leaves untagged files tagged.
# Run: `ruby scripts/annotate_yaml_schemas.rb`

require 'pathname'

ROOT = Pathname.new(File.expand_path('..', __dir__))
SCHEMA_REL = 'schemas/schema.yaml'

# [path_glob_relative_to_root, relative_schema_path_from_file, $def_name]
# External schemas use absolute URLs.
MAPPING = [
  ['_data/groups/*.yml',               '../schemas/schema.yaml', 'group'],
  ['_data/members/*.yaml',             '../schemas/schema.yaml', 'member'],
  ['_data/standards/*.yml',            '../schemas/schema.yaml', 'standard'],
  ['_data/projects/*.yml',             '../schemas/schema.yaml', 'project'],
  ['_data/events/plenary-meeting-*.yml', '../schemas/schema.yaml', 'plenary_event'],
  ['_data/history.yml',                '../schemas/schema.yaml', 'history_file'],
  ['_data/acknowledgments.yml',        '../schemas/schema.yaml', 'acknowledgments_file'],
  ['_data/associates.yml',             '../schemas/schema.yaml', 'associates_file'],
  ['_data/group_events.yml',           '../schemas/schema.yaml', 'group_events_file'],
  ['_data/liaisons.yml',               '../schemas/schema.yaml', 'liaisons_file'],
  ['_data/national_bodies.yml',        '../schemas/schema.yaml', 'national_bodies_file'],
  ['_data/secretariat.yml',            '../schemas/schema.yaml', 'secretariat_file'],
  ['_data/navigation_main.yml',        '../schemas/schema.yaml', 'navigation_main_config'],
  ['_data/navigation_sidebar.yml',     '../schemas/schema.yaml', 'navigation_sidebar_config'],
  ['schemas/stage_labels.yml',         'schema.yaml',            'stage_labels_file'],
  ['schemas/wg_labels.yml',            'schema.yaml',            'wg_labels_file'],
  ['data/meetings.yml',                '../schemas/schema.yaml', 'canonical_meetings_file'],
  ['.github/workflows/*.yml',          'https://json.schemastore.org/github-workflow.json', ''],
].freeze

ANNOTATION_PREFIX = '# yaml-language-server: $schema='

updated = 0
skipped = 0
missing = 0

MAPPING.each do |glob, schema_rel, def_name|
  files = Dir.glob(ROOT.join(glob))
  if files.empty?
    missing += 1
    warn "  ⚠ no files matched: #{glob}"
    next
  end

  files.each do |path|
    full = Pathname.new(path)
    content = full.read
    desired = if def_name.empty?
                "#{ANNOTATION_PREFIX}#{schema_rel}"
              else
                "#{ANNOTATION_PREFIX}#{schema_rel}#/$defs/#{def_name}"
              end

    lines = content.lines

    # Strip any existing yaml-language-server annotation line(s).
    cleaned = lines.reject { |l| l.start_with?(ANNOTATION_PREFIX) }

    # Determine where to insert. If the file starts with frontmatter `---`,
    # the annotation goes BEFORE the `---`. Otherwise it goes at the very top,
    # followed by a blank line if the next line is non-comment content.
    insert_at = 0
    if cleaned.first&.start_with?('---')
      insert_at = 0
    else
      insert_at = 0
    end

    # Preserve leading comments that are NOT the annotation: gather any
    # leading block of `#` comment lines and insert the annotation above them
    # so it stays at the very top where the LSP expects it.
    leading_comments = 0
    cleaned.each do |l|
      break unless l.start_with?('#') || l.strip.empty?
      leading_comments += 1
    end
    # We want the annotation as the very first line. Insert at index 0 and
    # let everything else shift down.
    new_lines = cleaned.dup
    new_lines.insert(0, desired + "\n")

    # Ensure a blank line separates the annotation from a following frontmatter
    # delimiter or comment block only if the next line is `---`. The LSP is
    # happy with the annotation directly above `---`.
    new_content = new_lines.join

    if new_content == content
      skipped += 1
    else
      full.write(new_content)
      updated += 1
    end
  end
end

puts "Annotated: #{updated} updated, #{skipped} already current, #{missing} globs unmatched."
