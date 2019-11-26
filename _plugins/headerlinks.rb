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

Jekyll::Hooks.register :documents, :post_render do |doc|
  site_hostname = URI(doc.site.config['url']).host
  unless doc.respond_to?(:asset_file?) and doc.asset_file?
    doc.output = process_content(site_hostname, doc.output)
  end
end

Jekyll::Hooks.register :pages, :post_render do |page|
  site_hostname = URI(page.site.config['url']).host
  unless page.respond_to?(:asset_file?) and page.asset_file?
    page.output = process_content(site_hostname, page.output)
  end
end
