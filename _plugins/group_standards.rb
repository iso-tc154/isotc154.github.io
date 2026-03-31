# frozen_string_literal: true

# Pre-compute standards grouped by series vs individual for each group.
# Produces site.data.group_standards[group_id] = {
#   series: [ { base_key, items: [{name, sid, pub_date, is_withdrawn}], has_published, has_withdrawn }, ... ],
#   individual: [ { name, sid, pub_date, is_withdrawn }, ... ]
# }
# Items sorted newest first (by pub_date, null/empty last).

require 'yaml'
require 'date'

class GroupStandardsGenerator < Jekyll::Generator
  def generate(site)
    group_standards = {}

    groups = site.data['groups'] || {}
    all_standards = site.data['standards'] || {}

    groups.each do |group_id, group_data|
      std_names = group_data['standards'] || []
      next if std_names.empty?

      # Build a name → sid + pub_date lookup
      name_to_info = {}
      all_standards.each do |sid, std|
        iso_name = std.dig('iso', 'name')
        name_to_info[iso_name] = {
          'sid' => sid,
          'pub_date' => std.dig('iso', 'publication_date'),
          'stage' => std.dig('iso', 'stage') || '',
        }
      end

      series_map = {}   # base_key → { base_key, items: [], has_published, has_withdrawn }
      individual = []    # [{ name, sid, pub_date, is_withdrawn }]

      std_names.each do |std_name|
        info = name_to_info[std_name] || {}
        sid = info['sid']
        pub_date = info['pub_date']
        stage = info['stage']
        is_withdrawn = (stage.to_s == '95.99')

        base_key, is_series = compute_base_key(std_name)

        entry = {
          'name' => std_name,
          'sid' => sid,
          'pub_date' => pub_date,
          'is_withdrawn' => is_withdrawn,
        }

        if is_series
          series_map[base_key] ||= {
            'base_key' => base_key,
            'items' => [],
            'has_published' => false,
            'has_withdrawn' => false,
          }
          series_map[base_key]['items'] << entry
          if is_withdrawn
            series_map[base_key]['has_withdrawn'] = true
          else
            series_map[base_key]['has_published'] = true
          end
        else
          individual << entry
          if is_withdrawn
            # individual withdrawn — mark on the entry
          end
        end
      end

      # Sort items within each series: published editions first, amendments, then withdrawn
      series_map.each_value do |s|
        s['items'].sort_by! do |item|
          [
            item['is_withdrawn'] ? 1 : 0,
            item['name'].include?('/Amd') || item['name'].include?('/Cor') ? 1 : 0,
            item['name'],
          ]
        end
      end

      # Sort series: published first, withdrawn-only last, then alphabetically
      series_sorted = series_map.values.sort_by do |s|
        if s['has_withdrawn'] && s['has_published'] == false
          [1, s['base_key']]
        else
          [0, s['base_key']]
        end
      end

      # Sort individual: published first, withdrawn last, then alphabetically
      individual_sorted = individual.sort_by do |item|
        [
          item['is_withdrawn'] ? 1 : 0,
          item['name'],
        ]
      end

      group_standards[group_id] = {
        'series' => series_sorted,
        'individual' => individual_sorted,
      }
    end

    site.data['group_standards'] = group_standards
  end

  # Derive base_key and whether this is a "series" (multi-part standard with a part number).
  #
  # "ISO 8601-1:2019/Amd 1:2022" → "ISO 8601-1", true (amendment → series)
  # "ISO 8601-1:2019"             → "ISO 8601-1", true (part 1 → series)
  # "ISO 8601:1988"               → "ISO 8601",  false (no part number → base standard, treated as individual)
  # "ISO 8601:2000"               → "ISO 8600",  false (no part number → base standard, treated as individual)
  # "ISO 34000:2023"               → "ISO 34000:2023", false (no hyphen → individual)
  #
  # Note: "ISO 8601:1988" etc. are editions of the base ISO 8601 standard without a part
  # number suffix. We keep them as "individual" here; in the template they can be
  # visually grouped under "ISO 8601 Editions" if desired.
  def compute_base_key(name)
    return [name, false] unless name.include?(':')

    before_colon = name.split(':').first.strip

    if name.include?('/Amd') || name.include?('/Cor')
      # Amendment — group under the edition it amends
      parts = before_colon.split('/').first
      return [parts.strip, true]
    elsif before_colon.include?('-')
      # Multi-part standard — ISO 8601-1, ISO 8601-2
      return [before_colon, true]
    else
      # Base standard without part number — ISO 8601:1988, ISO 34000:2023
      return [name, false]
    end
  end
end
