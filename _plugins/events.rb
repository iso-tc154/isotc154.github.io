module Jekyll

  class Site
    def read_events
      unfinished_events = []

      self.data['events'].each do |event_id, event_data|
        event_start = event_data['time']['from']['date']
        event_end = event_data['time']['to']['date']

        if event_end >= (Date.today + 1)
          event = event_data.clone

          event['id'] = event_id

          if event_start < (Date.today - 1)
            event['current'] = true
          end 

          unfinished_events << event
        end
      end

      self.data['unfinished_events'] = unfinished_events
    end
  end

  class EventReader < Generator
    safe true
    priority :low

    def generate(site)
      site.read_events
    end
  end
end