module Jekyll

  class Site

    def read_groups
      # Read groups from _data/groups/ YAML (migrated from .adoc collection)
      raw_groups = self.data['groups'] || {}

      self.data['groups'] = {}

      raw_groups.each do |id, group_data|
        self.data['groups'][id] = group_data.merge({
          'members' => [],
          'past_members' => [],
          'convenors' => [],
          'co_chairs' => [],
          'managers' => [],
        })
      end
    end

    def read_members
      # Read members from _data/members/ YAML files
      raw_members = self.data['members'] || {}
      committee = self.config['committee']

      self.data['members'] = {
        'all' => {},
        'chair' => {},
        'current' => [],
        'past' => [],
        'leadership' => [],
      }

      leadership_role_ids = ['chair', 'technical_programme_manager', 'committee_manager', 'convenor', 'co_chair']

      raw_members.each do |id, member_data|
        role_records = member_data['roles']

        is_the_chair = committee['chair'] == id

        # Build role index
        by_role_id = {
          '_all' => {
            'in' => {
              '_all' => [],
            },
          },
        }

        # Deduplicate: if a role_id has entries both with and without groups,
        # drop the groupless one (it's redundant)
        role_ids_with_group = Set.new
        role_ids_without_group = Set.new

        if role_records and role_records.respond_to?('each')
          role_records.each do |role_record|
            role_id = role_record['id']
            next unless role_id
            if role_record['group']
              role_ids_with_group.add(role_id)
            else
              role_ids_without_group.add(role_id)
            end
          end

          drop_ids = role_ids_with_group & role_ids_without_group

          role_records.each do |role_record|
            role_id = role_record['id']
            if role_id != nil
              group_id = role_record['group']

              # Skip groupless role if this role_id also has group entries
              if group_id.nil? && drop_ids.include?(role_id)
                next
              end

              role_timespan = {
                'from' => role_record['from'],
                'to' => role_record['to'],
              }

              by_role_id[role_id] ||= { 'in' => { '_all' => [] } }
              by_role_id[role_id]['in']['_all'] << role_record
              by_role_id['_all']['in']['_all'] << role_record

              if group_id
                if role_timespan['to'] == nil
                  if role_id == 'manager'
                    self.data['groups'][group_id]['managers'] << id
                  elsif role_id == 'convenor'
                    self.data['groups'][group_id]['convenors'] << id
                  elsif role_id == 'co_chair'
                    self.data['groups'][group_id]['co_chairs'] << id
                  elsif role_id == 'member'
                    self.data['groups'][group_id]['members'] << id
                  end
                elsif role_id == 'member'
                  self.data['groups'][group_id]['past_members'] << id
                end

                by_role_id[role_id]['in'][group_id] ||= []
                by_role_id[role_id]['in'][group_id] << role_record
                by_role_id['_all']['in'][group_id] ||= []
                by_role_id['_all']['in'][group_id] << role_record
              end
            end
          end
        else
          role_records = [member_data['role']]
          by_role_id['_all']['in']['_all'] = role_records
        end

        all_roles = by_role_id['_all']['in']['_all']
        is_current = member_data['active'] == true or all_roles.select { |role|
          if not role.is_a?(String)
            role['to'] == nil
          end
        }.size > 0

        is_in_leadership = all_roles.any? { |role|
          if role.is_a?(Hash)
            leadership_role_ids.include?(role['id']) && role['to'] == nil
          end
        }

        parsed_member = member_data.clone
        parsed_member['url'] = "/members/#{id}/"
        parsed_member['roles'] = by_role_id
        parsed_member['is_current'] = is_current
        parsed_member['is_the_chair'] = is_the_chair
        parsed_member['is_in_leadership'] = is_in_leadership

        self.data['members']['all'][id] = parsed_member

        if is_current
          if not is_the_chair and not is_in_leadership
            self.data['members']['current'] << id
          end

          if is_in_leadership
            self.data['members']['leadership'] << id
          end

          if is_the_chair
            self.data['members']['chair'] = id
          end

        else
          self.data['members']['past'] << id
        end
      end
    end

    def read_organization_members
      nb_data = self.data['national_bodies'] || []
      lia_data = self.data['liaisons'] || []

      # Build case-insensitive short_name -> id map from all orgs
      short_name_map = {}
      nb_data.each do |org|
        next unless org['short_name']
        short_name_map[org['short_name'].downcase] = org['id']
      end
      lia_data.each do |org|
        next unless org['short_name']
        short_name_map[org['short_name'].downcase] = org['id']
      end

      # Group members by their organization's id
      org_members = {}
      self.data['members']['all'].each do |member_id, member_data|
        aff = member_data['affiliation']
        next unless aff
        short_name = aff.split(',').first.strip.gsub('-', ' ')
        org_id = short_name_map[short_name.downcase]
        if org_id
          org_members[org_id] ||= []
          org_members[org_id] << member_id
        end
      end

      self.data['organization_members'] = org_members
    end

    def read_projects
      # Load directly from _data/projects/*.yaml
      projects_dir = File.join(self.source, '_data', 'projects')
      yaml_projects = {}
      Dir.glob(File.join(projects_dir, '*.{yaml,yml}')).each do |f|
        data = YAML.safe_load(File.read(f), permitted_classes: [Date, DateTime])
        if data.is_a?(Hash) && data['id']
          yaml_projects[data['id']] = data
        end
      end

      if yaml_projects.any?
        self.data['projects'] = yaml_projects
      else
        # Fallback to collection (for development)
        if self.collections['projects']
          projects = self.collections['projects'].docs.map(&:clone)
          self.data['projects'] = {}
          projects.each do |project|
            self.data['projects'][project.data['id']] = project
          end
        else
          self.data['projects'] = {}
        end
      end
    end

    def generate_member_pages
      self.data['members']['all'].each do |id, member_data|
        page = PageWithoutAFile.new(self, self.source, '', "members/#{id}/index.html")
        page.data['layout'] = 'member'
        page.data['title'] = member_data['name']
        page.data['member'] = member_data
        page.data['member-id'] = id
        # Expose processed member fields directly on page
        member_data.each do |key, val|
          page.data[key] = val
        end
        self.pages << page
      end
    end
  end

  class MemberDataReader < Generator
    safe true
    priority :high

    def generate(site)
      site.read_groups
      site.read_members
      site.read_organization_members
      site.read_projects
      site.generate_member_pages
    end
  end

end
