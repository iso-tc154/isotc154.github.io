module Jekyll
  module TCMinutes

    class TagPage < Page
      def initialize(site, base, dir, tag, items)
        @site = site
        @base = base
        @dir = dir
        @name = 'index.html'

        self.read_yaml(File.join(base, "_layouts"), "minutes_index.html")
        self.data['tag'] = tag
        self.data['items'] = items
        self.data['layout'] = 'minutes_index'
        self.data['title'] = "Tag #{tag} — minutes"
        self.process(@name)
      end
    end

    class TagPageGenerator < Generator
      safe true

      def generate(site)
        minutes = get_all_minutes(site)

        tags = {}
        minutes.each do |item|
          item.data['tags'].each do |tag|
            unless tags.key? tag
              tags[tag] = []
            end
            tags[tag].push(item)
          end
        end

        # Creates a filtered index page for each tag
        tags.each do |tag, tagged_items|
          site.pages << TagPage.new(
            site,
            site.source,
            File.join('minutes', tag.sub('/', '-').sub(' ', '-')),
            tag,
            tagged_items)
        end

      end
    end
  end
end

def get_all_minutes(site)
  minutes = site.collections['minutes'].docs.map(&:clone)

  default_time = Time.new(1989, 12, 31, 0, 0, 0, "+00:00")

  minutes.sort! { |i1, i2|
    val1 = i1.data.fetch('date', default_time) || default_time
    val2 = i2.data.fetch('date', default_time) || default_time
    (val2 <=> val1) || 0
  }

  return minutes
end
