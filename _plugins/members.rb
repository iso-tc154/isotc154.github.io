module Jekyll

  class Site

    def read_groups
      groups = self.collections['groups'].docs.map(&:clone)

      self.data['groups'] = {}

      groups.each do |group|
        self.data['groups'][group.data['_id']] = {
          'members' => [],
          'convenors' => [],
          'managers' => [],
        }
      end
    end

    def read_members
      members = self.collections['members'].docs.map(&:clone)
      committee = self.config['committee']

      # Does some pre-processing of member data for easier querying
      # and adds it under site.data[member_id]

      self.data['members'] = {
        'all' => {},
        'chair' => {},
        'current' => [],
        'past' => [],
        'leadership' => [],
      }

      members.each do |member|
        id = member.data['member-id']
        role_records = member.data['roles']

        is_the_chair = committee['chair'] == id
        is_in_leadership = committee['leadership'].select { |member_id| member_id == id }.size > 0

        # Groups roles as follows for querying in templates:
        # Role: { id: RoleID }
        # RoleTimespan: { from: DateWithPrecision, to: DateWithPrecision }
        # RoleGroup: { group: GroupID }
        # RoleID: string
        # GroupID: string
        # DateWithPrecision: { date: Date, precision: 'month' | 'year' }
        # GroupRoles: {
        #   in: {
        #     _all: (RoleTimespan & RoleGroup)[]
        #     [groupId]: RoleTimespan[]
        #   }
        # }
        # Members: {
        #   _all: GroupRoles
        #   [roleId]: GroupRoles
        # }
        # member[role_id | '_all'].in[group_id | '_all']: Timespan
        by_role_id = {
          '_all' => {
            'in' => {
              '_all' => [],
            },
          },
        }
        if role_records and role_records.respond_to?('each')
          role_records.each do |role_record|
            role_timespan = {
              'from' => role_record['from'],
              'to' => role_record['to'],
            }
            role_id = role_record['id']
            if role_id != nil
              group_id = role_record['group']

              by_role_id[role_id] ||= { 'in' => { '_all' => [] } }
              by_role_id[role_id]['in']['_all'] << role_record
              by_role_id['_all']['in']['_all'] << role_record

              if group_id
                if role_timespan['to'] == nil
                  if role_id == 'manager'
                    self.data['groups'][group_id]['managers'] << id
                  elsif role_id == 'convenor'
                    self.data['groups'][group_id]['convenors'] << id
                  elsif role_id == 'member'
                    self.data['groups'][group_id]['members'] << id
                  else
                    p 'WARNING: Unknown role in group', role_id
                  end
                end

                by_role_id[role_id]['in'][group_id] ||= []
                by_role_id[role_id]['in'][group_id] << role_record
                by_role_id['_all']['in'][group_id] ||= []
                by_role_id['_all']['in'][group_id] << role_record
              end
            end
          end
        else
          role_records = [member.data['role']]
          by_role_id['_all']['in']['_all'] = role_records
        end

        all_roles = by_role_id['_all']['in']['_all']
        is_current = member.data['active'] == true or all_roles.select { |role|
          if not role.is_a?(String)
            role['to'] == nil
          end
        }.size > 0

        parsed_member = member.data.clone
        parsed_member['url'] = member.url
        parsed_member['roles'] = by_role_id

        parsed_member['is_current'] = is_current
        # Has a role currently.
        # If is not current, is assumed to be past.

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

    def read_projects
      projects = self.collections['projects'].docs.map(&:clone)

      self.data['projects'] = {}

      projects.each do |project|
        self.data['projects'][project.data['id']] = project
      end
    end
  end

  class MemberDataReader < Generator
    safe true
    priority :high

    def generate(site)
      site.read_groups
      site.read_members
      site.read_projects
    end
  end

end
