require 'nokogiri'
require 'uri'

# Given hostname and content, updates <hN> tags, adding trailing <a class="anchor-link"></a>.
def process_content(site_hostname, content)
  content = Nokogiri::HTML(content)
  content.css('main h2[id], main h3[id], main h4[id], main h5[id]').each do |el|
    html_id = el.get_attribute('id')
    el.inner_html = "#{el.inner_html}<a class='anchor-link' href='./##{html_id}'><i class='fas fa-link'></i></a>"
  end
  return content.to_s
end

# Keeps track of already processed items to avoid duplicate anchors.
$processed_urls = []

# Jekyll hook handler function.
def process_doc_or_page(doc)
  site_hostname = URI(doc.site.config['url']).host
  unless doc.respond_to?(:asset_file?) and doc.asset_file?
    if doc.respond_to?(:id)
      if $processed_urls.include? doc.id
        return
      end
      $processed_urls << doc.id
    end
    doc.output = process_content(site_hostname, doc.output)
  end
end

Jekyll::Hooks.register :documents, :post_render do |doc| process_doc_or_page(doc) end

Jekyll::Hooks.register :pages, :post_render do |page| process_doc_or_page(page) end