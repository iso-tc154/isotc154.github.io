module Jekyll

  class GroupsPageGenerator < Generator
    safe true
    priority :high

    def generate(site)
      groups = site.data['groups'] || {}

      groups.each do |id, data|
        next unless data

        page = PageWithoutAFile.new(site, site.source, 'groups', "#{id}/index.html")
        page.data['layout'] = 'group'
        page.data['title'] = data['title']
        page.data['group'] = data
        page.data['group_id'] = id
        site.pages << page
      end

      # Build a sorted array for the groups listing page
      site.data['groups_sorted'] = groups.values
        .compact
        .sort_by { |g| [(g['order'] || 99).to_i, g['id'].to_s] }
    end
  end

end
