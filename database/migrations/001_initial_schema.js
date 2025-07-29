export const up = async (knex) => {
  // Organizations table
  await knex.schema.createTable('organization', (table) => {
    table.string('id').primary();
    table.text('data');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.index('created_at');
  });

  // Organization properties table
  await knex.schema.createTable('organization_property', (table) => {
    table.string('org_id').notNullable();
    table.string('name').notNullable();
    table.text('value').notNullable();
    table.boolean('hidden').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['org_id', 'name']);
    table.foreign('org_id').references('id').inTable('organization').onDelete('CASCADE');
    
    table.index('hidden');
    table.index(['name', 'value']);
  });

  // Roles table
  await knex.schema.createTable('role', (table) => {
    table.string('id').notNullable();
    table.string('org_id').notNullable();
    table.text('data');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['id', 'org_id']);
    table.foreign('org_id').references('id').inTable('organization').onDelete('CASCADE');
    
    table.index('org_id');
    table.index('created_at');
  });

  // Role properties table
  await knex.schema.createTable('role_property', (table) => {
    table.string('role_id').notNullable();
    table.string('org_id').notNullable();
    table.string('name').notNullable();
    table.text('value').notNullable();
    table.boolean('hidden').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['role_id', 'org_id', 'name']);
    table.foreign(['role_id', 'org_id']).references(['id', 'org_id']).inTable('role').onDelete('CASCADE');
    
    table.index('hidden');
    table.index(['name', 'value']);
  });

  // Users table
  await knex.schema.createTable('user', (table) => {
    table.string('id').notNullable();
    table.string('org_id').notNullable();
    table.string('identity_provider').notNullable();
    table.string('identity_provider_user_id').notNullable();
    table.text('data');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['id', 'org_id']);
    table.foreign('org_id').references('id').inTable('organization').onDelete('CASCADE');
    
    table.index('org_id');
    table.index(['identity_provider', 'identity_provider_user_id']);
    table.index('created_at');
  });

  // User properties table
  await knex.schema.createTable('user_property', (table) => {
    table.string('user_id').notNullable();
    table.string('org_id').notNullable();
    table.string('name').notNullable();
    table.text('value').notNullable();
    table.boolean('hidden').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'org_id', 'name']);
    table.foreign(['user_id', 'org_id']).references(['id', 'org_id']).inTable('user').onDelete('CASCADE');
    
    table.index('hidden');
    table.index(['name', 'value']);
  });

  // Resources table
  await knex.schema.createTable('resource', (table) => {
    table.string('id').notNullable(); // This is the path
    table.string('org_id').notNullable();
    table.text('data');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['id', 'org_id']);
    table.foreign('org_id').references('id').inTable('organization').onDelete('CASCADE');
    
    table.index('org_id');
    table.index('created_at');
    // Index for prefix searches
    table.index(knex.raw('id text_pattern_ops'));
  });

  // User-Role assignments table
  await knex.schema.createTable('user_role', (table) => {
    table.string('user_id').notNullable();
    table.string('role_id').notNullable();
    table.string('org_id').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'role_id', 'org_id']);
    table.foreign(['user_id', 'org_id']).references(['id', 'org_id']).inTable('user').onDelete('CASCADE');
    table.foreign(['role_id', 'org_id']).references(['id', 'org_id']).inTable('role').onDelete('CASCADE');
    
    table.index(['user_id', 'org_id']);
    table.index(['role_id', 'org_id']);
  });

  // User permissions table
  await knex.schema.createTable('user_permission', (table) => {
    table.string('user_id').notNullable();
    table.string('org_id').notNullable();
    table.string('resource_id').notNullable();
    table.string('action').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'org_id', 'resource_id', 'action']);
    table.foreign(['user_id', 'org_id']).references(['id', 'org_id']).inTable('user').onDelete('CASCADE');
    table.foreign(['resource_id', 'org_id']).references(['id', 'org_id']).inTable('resource').onDelete('CASCADE');
    
    table.index(['user_id', 'org_id']);
    table.index(['resource_id', 'org_id']);
    table.index('action');
  });

  // Role permissions table
  await knex.schema.createTable('role_permission', (table) => {
    table.string('role_id').notNullable();
    table.string('org_id').notNullable();
    table.string('resource_id').notNullable();
    table.string('action').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.primary(['role_id', 'org_id', 'resource_id', 'action']);
    table.foreign(['role_id', 'org_id']).references(['id', 'org_id']).inTable('role').onDelete('CASCADE');
    table.foreign(['resource_id', 'org_id']).references(['id', 'org_id']).inTable('resource').onDelete('CASCADE');
    
    table.index(['role_id', 'org_id']);
    table.index(['resource_id', 'org_id']);
    table.index('action');
  });
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists('role_permission');
  await knex.schema.dropTableIfExists('user_permission');
  await knex.schema.dropTableIfExists('user_role');
  await knex.schema.dropTableIfExists('resource');
  await knex.schema.dropTableIfExists('user_property');
  await knex.schema.dropTableIfExists('user');
  await knex.schema.dropTableIfExists('role_property');
  await knex.schema.dropTableIfExists('role');
  await knex.schema.dropTableIfExists('organization_property');
  await knex.schema.dropTableIfExists('organization');
};