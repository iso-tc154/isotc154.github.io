# Liquid filter to preprocess AsciiDoc content before rendering.
# Inserts blank lines before list items that immediately follow regular text,
# which AsciiDoc requires to distinguish list blocks from paragraph content.

module AsciidocHelpers
  module LiquidFilter
    def preprocess_asciidoc(input)
      return input unless input.is_a?(String) && input.include?("\n")

      lines = input.split("\n")
      result = []

      lines.each_with_index do |line, i|
        # Detect AsciiDoc list item: line starting with * - + or .
        if line =~ /\A(\s*)([-*+]|[-*+]|\.) /
          prev = i > 0 ? lines[i - 1] : nil
          # Only insert blank line if previous line is non-blank, non-list content
          # AND the line before THAT is not already blank (don't double-blank)
          if prev && prev !~ /\A\s*\z/ && prev !~ /\A\s*(\*|[-*+]|\.)(\s|$)/
            ppred = i > 1 ? lines[i - 2] : nil
            if !ppred || ppred !~ /\A\s*\z/
              result << ""
            end
          end
        end
        result << line
      end

      result.join("\n")
    end
  end
end

Liquid::Template.register_filter(AsciidocHelpers::LiquidFilter)
