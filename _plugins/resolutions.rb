module Jekyll

  class Site

    def read_resolutions
      return unless self.data['resolutions']

      all_resolutions = []
      years = Set.new
      categories = Set.new
      by_key = {}
      by_year = {}

      group_pattern = /(?:WG|JWG|SG|AG|CAG)\s*(\d+|[A-Z]\d*)/i
      known_groups = %w[wg3 wg4 wg5 wg6 wg7 jwg1 jwg8 jwg9 cag 7372ma sg1 ag1]

      process_source = lambda do |source_data, source_type|
        next unless source_data.is_a?(Hash)

        source_data.each do |filename, file_data|
          next unless file_data.is_a?(Hash)

          metadata = file_data['metadata'] || {}
          resolutions = file_data['resolutions'] || []

          meeting_date = nil
          if metadata['dates'].is_a?(Array) && !metadata['dates'].empty?
            meeting_date = metadata['dates'].first['start']
          end

          year = nil
          if meeting_date
            begin
              year = Date.parse(meeting_date).year.to_s
              years.add(year)
            rescue
              year = meeting_date[0..3]
              years.add(year)
            end
          end

          resolutions.each do |res|
            next unless res.is_a?(Hash)

            res_categories = res['categories'] || []
            res_categories.each { |c| categories.add(c) }

            # Extract group_id from categories
            group_id = nil
            res_categories.each do |cat|
              cat_lower = cat.downcase
              known_groups.each do |g|
                if cat_lower.include?(g.sub('jwg', 'jwg ').sub('wg', 'wg '))
                  group_id = g
                  break
                end
              end
              break if group_id

              if match = cat.match(group_pattern)
                group_num = match[1].downcase
                prefix = cat.downcase.include?('jwg') ? 'jwg' : 'wg'
                group_id = "#{prefix}#{group_num}"
                break
              end
            end

            unless group_id
              text = "#{res['title']} #{res['subject']}".downcase
              known_groups.each do |g|
                display = g.sub('wg', 'WG ').sub('jwg', 'JWG ').sub('cag', 'CAG').sub('7372ma', '7372MA').sub('sg', 'SG ').sub('ag', 'AG ')
                if text.include?(display.downcase)
                  group_id = g
                  break
                end
              end
            end

            # Extract considerations (full)
            considerations = []
            if res['considerations'].is_a?(Array)
              res['considerations'].each do |c|
                next unless c.is_a?(Hash)
                considerations << {
                  'type' => c['type'] || '',
                  'message' => c['message'] || '',
                  'dates' => c['dates'] || [],
                }
              end
            end

            # Extract actions (full, no truncation)
            actions = []
            if res['actions'].is_a?(Array)
              res['actions'].each do |a|
                next unless a.is_a?(Hash)
                actions << {
                  'type' => a['type'] || '',
                  'message' => a['message'] || '',
                  'subject' => a['subject'] || '',
                  'dates' => a['dates'] || [],
                }
              end
            end

            identifier = res['identifier'] || ''

            entry = {
              'source_file' => filename,
              'source_type' => source_type,
              'source_title' => metadata['title'] || '',
              'meeting_date' => meeting_date || '',
              'year' => year || '',
              'identifier' => identifier,
              'title' => res['title'] || '',
              'subject' => res['subject'] || '',
              'categories' => res_categories,
              'group_id' => group_id,
              'considerations' => considerations,
              'actions' => actions,
              'approvals' => res['approvals'] || [],
              'dates' => res['dates'] || [],
            }

            all_resolutions << entry

            # Build lookup key
            key = "#{source_type}/#{filename}/#{identifier}"
            by_key[key] = entry

            # Group by year
            if year
              by_year[year] ||= []
              by_year[year] << entry
            end
          end
        end
      end

      if self.data['resolutions']['plenary']
        process_source.call(self.data['resolutions']['plenary'], 'plenary')
      end

      if self.data['resolutions']['ballots']
        process_source.call(self.data['resolutions']['ballots'], 'ballot')
      end

      if self.data['resolutions']['7372ma']
        process_source.call(self.data['resolutions']['7372ma'], '7372ma')
      end

      all_resolutions.sort_by! { |r| [r['meeting_date'], r['identifier']] }.reverse!

      # Sort resolutions within each year by identifier descending
      by_year.each do |y, res_list|
        res_list.sort_by! { |r| r['identifier'] }.reverse!
      end

      self.data['resolutions_all'] = all_resolutions
      self.data['resolutions_years'] = years.sort.reverse
      self.data['resolutions_categories'] = categories.sort
      self.data['resolutions_by_key'] = by_key
      self.data['resolutions_by_year'] = by_year
    end

  end

  # Year index page
  class ResolutionYearPage < PageWithoutAFile
    def initialize(site, base, year, resolutions)
      super(site, base, 'resolutions', "#{year}.html")
      self.data['layout'] = 'resolution_year'
      self.data['title'] = "Resolutions #{year}"
      self.data['permalink'] = "/resolutions/#{year}/"
      self.data['year'] = year
      self.data['resolutions'] = resolutions
    end
  end

  # Detail page for a single resolution
  class ResolutionDetailPage < PageWithoutAFile
    def initialize(site, base, resolution)
      source_type = resolution['source_type']
      source_file = resolution['source_file']
      identifier = resolution['identifier'].to_s.gsub('/', '-')
      super(site, base, "resolutions/#{source_type}/#{source_file}", "#{identifier}.html")
      self.data['layout'] = 'resolution_detail'
      self.data['title'] = resolution['title'] || resolution['identifier']
      self.data['permalink'] = "/resolutions/#{source_type}/#{source_file}/#{identifier}/"
      self.data['resolution'] = resolution
    end
  end

  class ResolutionsGenerator < Generator
    safe true
    priority :low

    def generate(site)
      site.read_resolutions

      by_year = site.data['resolutions_by_year'] || {}
      by_key = site.data['resolutions_by_key'] || {}

      # Generate year index pages
      by_year.each do |year, resolutions|
        page = ResolutionYearPage.new(site, site.source, year, resolutions)
        site.pages << page
      end

      # Generate detail pages
      by_key.each do |key, resolution|
        page = ResolutionDetailPage.new(site, site.source, resolution)
        site.pages << page
      end
    end
  end

end
