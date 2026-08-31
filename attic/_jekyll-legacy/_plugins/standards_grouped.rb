# frozen_string_literal: true

# Pre-compute grouped standards data for the sidebar navigation.
# Produces site.data.standards_grouped = [ { base_key, children, has_published, has_withdrawn }, ... ]
# Groups published/confirmed first, withdrawn last.
# Each child: { sid, name, stage, is_withdrawn, is_amendment }

require 'yaml'
require 'date'

class StandardsGroupedGenerator < Jekyll::Generator
  def generate(site)
    grouped = {} # base_key => { base_key, children[], has_published, has_withdrawn }

    # Process all standards
    (site.data['standards'] || {}).each do |sid, std|
      iso = std['iso'] || {}
      name = iso['name'].to_s
      stage = (iso['stage'] || '').to_s
      next if name.empty?

      # Determine base key for grouping
      base_key, is_amendment = compute_base_key(name)

      # Determine status
      is_withdrawn = (stage == '95.99')

      # Initialize group if needed
      unless grouped[base_key]
        grouped[base_key] = {
          'base_key' => base_key,
          'children' => [],
          'has_published' => false,
          'has_withdrawn' => false
        }
      end

      # Add child
      grouped[base_key]['children'] << {
        'sid' => sid,
        'name' => name,
        'stage' => stage,
        'is_withdrawn' => is_withdrawn,
        'is_amendment' => is_amendment
      }

      # Update group status
      if is_withdrawn
        grouped[base_key]['has_withdrawn'] = true
      else
        grouped[base_key]['has_published'] = true
      end
    end

    # Sort children within each group: published editions first, then amendments, then withdrawn
    grouped.each_value do |g|
      g['children'].sort_by! do |c|
        [
          c['is_withdrawn'] ? 1 : 0,      # published first
          c['is_amendment'] ? 1 : 0,      # editions before amendments
          c['name']                         # alphabetical within same type
        ]
      end
    end

    # Sort groups: published/confirmed first, withdrawn-only last
    sorted = grouped.values.sort_by do |g|
      if g['has_withdrawn'] && g['has_published'] == false
        [1, g['base_key']]  # withdrawn-only groups last
      else
        [0, g['base_key']]  # published groups first
      end
    end

    site.data['standards_grouped'] = sorted

    # Also build standards grouped by WG for the main standards index page.
    # site.data.standards_by_wg = { 'wg5' => [ { sid, name, pub_date, stage, is_withdrawn }, ... ], ... }
    # Within each WG: published first, sorted newest first; withdrawn last.
    by_wg = {}
    (site.data['standards'] || {}).each do |sid, std|
      iso = std['iso'] || {}
      tc154 = std['tc154'] || {}
      name = iso['name'].to_s
      stage = (iso['stage'] || '').to_s
      pub_date = iso['publication_date'].to_s
      next if name.empty?

      group_id = tc154['group'].to_s
      is_withdrawn = (stage == '95.99')

      entry = {
        'sid' => sid,
        'name' => name,
        'pub_date' => pub_date,
        'stage' => stage,
        'is_withdrawn' => is_withdrawn,
        'type' => iso['type'] || '',
        'title' => iso['title'] || '',
      }

      by_wg[group_id] ||= []
      by_wg[group_id] << entry
    end

    # Sort each WG's list: published first (newest first), then withdrawn (newest first)
    by_wg.each_value do |entries|
      published = entries.reject { |e| e['is_withdrawn'] }
      withdrawn = entries.select { |e| e['is_withdrawn'] }
      published.sort! { |a, b| b['pub_date'] <=> a['pub_date'] }
      withdrawn.sort! { |a, b| b['pub_date'] <=> a['pub_date'] }
      entries.replace(published + withdrawn)
    end

    site.data['standards_by_wg'] = by_wg

    # Build a flat array of all standards for the standards index page.
    flat = []
    by_wg.each do |wg_id, entries|
      entries.each do |e|
        flat << e.merge('wg' => wg_id)
      end
    end
    site.data['standards_flat'] = flat
  end

  # Extract base_key and whether this is an amendment
  # "ISO 8601-1:2019/Amd 1:2022" → "ISO 8601-1", true
  # "ISO 8601-1:2019"             → "ISO 8601-1", false
  # "ISO 34000:2023"              → "ISO 34000", false (group with other ISO 34000 editions)
  # "ISO 7372:2005"               → "ISO 7372",  false (group with other ISO 7372 editions)
  # "ISO 9735:1988"               → "ISO 9735",  false (group with other ISO 9735 editions)
  def compute_base_key(name)
    return [name, false] unless name.include?(':')

    before_colon = name.split(':').first.strip

    if name.include?('/Amd') || name.include?('/Cor')
      # Amendment — group under parent edition
      parts = before_colon.split('/').first
      return [parts.strip, true]
    elsif before_colon.include?('-')
      # Edition with a part number — group under the edition (e.g., ISO 8601-1, ISO 14533-1)
      return [before_colon, false]
    elsif before_colon =~ /\AISO \d+\z/
      # Pure numeric base (e.g., "ISO 7372", "ISO 34000", "ISO 9735") — group by base number
      return [before_colon, false]
    else
      # Monolithic standard with alphanumeric suffix — no grouping
      return [name, false]
    end
  end
end
