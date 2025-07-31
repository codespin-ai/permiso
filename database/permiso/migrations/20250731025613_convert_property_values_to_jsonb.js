export const up = async (knex) => {
  // Convert organization_property.value from text to jsonb
  await knex.raw(`
    ALTER TABLE organization_property
    ALTER COLUMN value TYPE jsonb
    USING value::jsonb
  `);

  // Convert role_property.value from text to jsonb
  await knex.raw(`
    ALTER TABLE role_property
    ALTER COLUMN value TYPE jsonb
    USING value::jsonb
  `);

  // Convert user_property.value from text to jsonb
  await knex.raw(`
    ALTER TABLE user_property
    ALTER COLUMN value TYPE jsonb
    USING value::jsonb
  `);

  // Add GIN indexes for better JSONB query performance
  await knex.raw('CREATE INDEX idx_organization_property_value ON organization_property USING gin(value)');
  await knex.raw('CREATE INDEX idx_role_property_value ON role_property USING gin(value)');
  await knex.raw('CREATE INDEX idx_user_property_value ON user_property USING gin(value)');
};

export const down = async (knex) => {
  // Drop the GIN indexes
  await knex.raw('DROP INDEX IF EXISTS idx_organization_property_value');
  await knex.raw('DROP INDEX IF EXISTS idx_role_property_value');
  await knex.raw('DROP INDEX IF EXISTS idx_user_property_value');

  // Convert back to text
  await knex.raw(`
    ALTER TABLE organization_property
    ALTER COLUMN value TYPE text
    USING value::text
  `);

  await knex.raw(`
    ALTER TABLE role_property
    ALTER COLUMN value TYPE text
    USING value::text
  `);

  await knex.raw(`
    ALTER TABLE user_property
    ALTER COLUMN value TYPE text
    USING value::text
  `);
};