# frozen_string_literal: true

# Single source of truth for the enum values enforced by the YAML validator.
#
# The validator used to duplicate every enum (STAGES, ROLE_IDS, ...) as a Ruby
# constant alongside the same enum declared in schemas/schema.yaml. They drifted.
# (Last week the validator rejected `published` / `secretary` / `logo_light`
# values that the schema already permitted — PRs #86–88.)
#
# This module reads the schema once and exposes its enums via path lookup so
# the validator can never get out of sync again.
#
#   SchemaEnums.enum('project.properties.stage.enum')
#   SchemaEnums.enum('member_role.properties.id.enum')
#
# Paths are relative to $defs (the schema's only top-level key).

require 'yaml'
require 'pathname'

module SchemaEnums
  SCHEMA_FILE = Pathname.new(__dir__).join('..', '..', 'schemas', 'schema.yaml').freeze
  DEFS = YAML.safe_load(SCHEMA_FILE.read, permitted_classes: [], permitted_symbols: [], aliases: true)['$defs']

  class << self
    # Returns the enum array at the given $defs-relative path, e.g.
    #   enum('project.properties.stage.enum')
    # Raises IndexError if the path doesn't resolve to an Array.
    def enum(path)
      keys = path.split('.')
      cursor = DEFS
      keys.each do |k|
        cursor = cursor[k] || cursor[k.to_sym]
        raise IndexError, "schemas/schema.yaml $defs.#{path} not found (failed at '#{k}')" if cursor.nil?
      end
      unless cursor.is_a?(Array)
        raise IndexError,
              "schemas/schema.yaml $defs.#{path} is not an enum (got #{cursor.class})"
      end
      cursor.freeze
    end

    # Convenience accessors — one method per enum the validator cares about.
    # Add new ones as the schema grows.
    def stages = enum('project.properties.stage.enum')
    def role_ids = enum('member_role.properties.id.enum')
    def doc_types = enum('standard.properties.iso.properties.type.enum')
    def group_statuses = enum('standard.properties.tc154.properties.status.enum')
    def liaison_categories = enum('liaison.properties.category.enum')
    def project_statuses = enum('project.properties.status.enum')
    def date_precisions = enum('role_period.properties.precision.enum')
  end

  # Boot-time self-check: every accessor must resolve. If a future schema
  # refactor renames or removes an enum path, the validator fails to start
  # with a clear error rather than silently producing an empty allowlist.
  STAGES = stages
  ROLE_IDS = role_ids
  DOC_TYPES = doc_types
  GROUP_STATUSES = group_statuses
  LIAISON_CATEGORIES = liaison_categories
  PROJECT_STATUSES = project_statuses
  DATE_PRECISIONS = date_precisions
end
