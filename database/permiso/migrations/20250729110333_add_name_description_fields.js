export const up = async (knex) => {
  // Add name and description to organization table
  await knex.schema.alterTable('organization', (table) => {
    table.string('name').notNullable().defaultTo('');
    table.text('description');
  });

  // Add name and description to role table
  await knex.schema.alterTable('role', (table) => {
    table.string('name').notNullable().defaultTo('');
    table.text('description');
  });

  // Add name and description to resource table
  await knex.schema.alterTable('resource', (table) => {
    table.string('name');
    table.text('description');
  });

  // Create indexes on name columns for better query performance
  await knex.schema.alterTable('organization', (table) => {
    table.index('name');
  });

  await knex.schema.alterTable('role', (table) => {
    table.index(['org_id', 'name']);
  });

  await knex.schema.alterTable('resource', (table) => {
    table.index(['org_id', 'name']);
  });
};

export const down = async (knex) => {
  // Drop indexes first
  await knex.schema.alterTable('resource', (table) => {
    table.dropIndex(['org_id', 'name']);
  });

  await knex.schema.alterTable('role', (table) => {
    table.dropIndex(['org_id', 'name']);
  });

  await knex.schema.alterTable('organization', (table) => {
    table.dropIndex('name');
  });

  // Remove columns
  await knex.schema.alterTable('resource', (table) => {
    table.dropColumn('name');
    table.dropColumn('description');
  });

  await knex.schema.alterTable('role', (table) => {
    table.dropColumn('name');
    table.dropColumn('description');
  });

  await knex.schema.alterTable('organization', (table) => {
    table.dropColumn('name');
    table.dropColumn('description');
  });
};