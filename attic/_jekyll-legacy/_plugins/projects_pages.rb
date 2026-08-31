# Generates individual project detail pages from _data/projects/*.yaml
# Replaces the old _projects/*.adoc collection-based approach.

module Jekyll
  class ProjectsPageGenerator < Generator
    safe true
    priority :high

    def generate(site)
      raw_projects = site.data['projects'] || {}

      raw_projects.each do |id, data|
        next unless data
        proj_data = data.respond_to?(:data) ? data.data : data

        page = PageWithoutAFile.new(site, site.source, 'projects', "#{id}/index.html")
        page.data['layout'] = 'project'
        page.data['title'] = proj_data['title']
        page.data['project'] = proj_data
        page.data['id'] = id
        # Expose top-level fields directly on page for the layout
        proj_data.each do |key, val|
          page.data[key] = val unless key == 'scope'
        end
        site.pages << page
      end
    end
  end
end
