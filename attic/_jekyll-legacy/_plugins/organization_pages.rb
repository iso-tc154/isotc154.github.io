module Jekyll

  class OrganizationPageGenerator < Generator
    safe true
    priority :high

    def generate(site)
      # Generate liaison organization detail pages
      liaisons = site.data['liaisons'] || []
      liaisons.each do |org|
        next unless org['id']
        page = PageWithoutAFile.new(site, site.source, '', "liaisons/#{org['id']}/index.html")
        page.data['layout'] = 'organization_detail'
        page.data['title'] = org['name']
        page.data['organization_type'] = 'liaison'
        page.data['organization_id'] = org['id']
        page.data['organization'] = org
        site.pages << page
      end

      # Generate national body detail pages
      bodies = site.data['national_bodies'] || []
      bodies.each do |org|
        next unless org['id']
        page = PageWithoutAFile.new(site, site.source, '', "national-bodies/#{org['id']}/index.html")
        page.data['layout'] = 'organization_detail'
        page.data['title'] = org['name']
        page.data['organization_type'] = 'national_body'
        page.data['organization_id'] = org['id']
        page.data['organization'] = org
        site.pages << page
      end
    end
  end

end
