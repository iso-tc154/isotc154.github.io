module Jekyll

  class StandardsPageGenerator < Generator
    safe true
    priority :high

    def generate(site)
      standards = site.data['standards'] || {}
      groups = site.data['groups'] || {}

      standards.each do |id, data|
        next unless data && data['iso']

        page = PageWithoutAFile.new(site, site.source, 'standards', "#{id}/index.html")
        page.data['layout'] = 'standard'
        page.data['title'] = data.dig('iso', 'title')
        page.data['iso'] = data['iso']
        page.data['tc154'] = data['tc154']
        page.data['standard_id'] = id
        site.pages << page
      end
    end
  end

end
