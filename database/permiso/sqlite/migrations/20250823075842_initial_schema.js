/**
 * SQLite Schema for Permiso
 *
 * This mirrors the PostgreSQL schema but adapted for SQLite:
 * - Uses TEXT instead of VARCHAR(255)
 * - Uses INTEGER for bigint timestamps
 * - Uses TEXT (JSON) instead of JSONB
 * - No RLS (app-level tenant filtering used instead)
 * - No text_pattern_ops index
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create organization table
  await knex.schema.createTable("organization", (table) => {
    table.text("id").primary();
    table.text("name").notNullable();
    table.text("description");
    table.integer("created_at").notNullable();
    table.integer("updated_at").notNullable();

    // Indexes
    table.index("created_at");
    table.index("name");
  });

  // Create organization_property table
  await knex.schema.createTable("organization_property", (table) => {
    table.text("parent_id").notNullable();
    table.text("name").notNullable();
    table.text("value").notNullable(); // JSON stored as TEXT
    table.integer("hidden").notNullable().defaultTo(0);
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["parent_id", "name"]);

    // Foreign key
    table
      .foreign("parent_id")
      .references("id")
      .inTable("organization")
      .onDelete("CASCADE");

    // Indexes
    table.index("hidden");
  });

  // Create role table
  await knex.schema.createTable("role", (table) => {
    table.text("id").notNullable();
    table.text("org_id").notNullable();
    table.text("name").notNullable();
    table.text("description");
    table.integer("created_at").notNullable();
    table.integer("updated_at").notNullable();

    // Composite primary key
    table.primary(["id", "org_id"]);

    // Foreign key
    table
      .foreign("org_id")
      .references("id")
      .inTable("organization")
      .onDelete("CASCADE");

    // Indexes
    table.index("created_at");
    table.index("org_id");
    table.index(["org_id", "name"]);
  });

  // Create role_property table
  await knex.schema.createTable("role_property", (table) => {
    table.text("parent_id").notNullable();
    table.text("org_id").notNullable();
    table.text("name").notNullable();
    table.text("value").notNullable(); // JSON stored as TEXT
    table.integer("hidden").notNullable().defaultTo(0);
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["parent_id", "org_id", "name"]);

    // Foreign key
    table
      .foreign(["parent_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("role")
      .onDelete("CASCADE");

    // Indexes
    table.index("hidden");
  });

  // Create user table
  await knex.schema.createTable("user", (table) => {
    table.text("id").notNullable();
    table.text("org_id").notNullable();
    table.text("identity_provider").notNullable();
    table.text("identity_provider_user_id").notNullable();
    table.integer("created_at").notNullable();
    table.integer("updated_at").notNullable();

    // Composite primary key
    table.primary(["id", "org_id"]);

    // Foreign key
    table
      .foreign("org_id")
      .references("id")
      .inTable("organization")
      .onDelete("CASCADE");

    // Indexes
    table.index("created_at");
    table.index("org_id");
    table.index(["identity_provider", "identity_provider_user_id"]);
  });

  // Create user_property table
  await knex.schema.createTable("user_property", (table) => {
    table.text("parent_id").notNullable();
    table.text("org_id").notNullable();
    table.text("name").notNullable();
    table.text("value").notNullable(); // JSON stored as TEXT
    table.integer("hidden").notNullable().defaultTo(0);
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["parent_id", "org_id", "name"]);

    // Foreign key
    table
      .foreign(["parent_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("user")
      .onDelete("CASCADE");

    // Indexes
    table.index("hidden");
  });

  // Create resource table
  await knex.schema.createTable("resource", (table) => {
    table.text("id").notNullable();
    table.text("org_id").notNullable();
    table.text("name");
    table.text("description");
    table.integer("created_at").notNullable();
    table.integer("updated_at").notNullable();

    // Composite primary key
    table.primary(["id", "org_id"]);

    // Foreign key
    table
      .foreign("org_id")
      .references("id")
      .inTable("organization")
      .onDelete("CASCADE");

    // Indexes
    table.index("created_at");
    table.index("org_id");
    table.index(["org_id", "name"]);
  });

  // Create user_role table
  await knex.schema.createTable("user_role", (table) => {
    table.text("user_id").notNullable();
    table.text("role_id").notNullable();
    table.text("org_id").notNullable();
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["user_id", "role_id", "org_id"]);

    // Foreign keys
    table
      .foreign(["user_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("user")
      .onDelete("CASCADE");
    table
      .foreign(["role_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("role")
      .onDelete("CASCADE");

    // Indexes
    table.index(["user_id", "org_id"]);
    table.index(["role_id", "org_id"]);
  });

  // Create user_permission table
  await knex.schema.createTable("user_permission", (table) => {
    table.text("user_id").notNullable();
    table.text("org_id").notNullable();
    table.text("resource_id").notNullable();
    table.text("action").notNullable();
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["user_id", "org_id", "resource_id", "action"]);

    // Foreign keys
    table
      .foreign(["user_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("user")
      .onDelete("CASCADE");
    // Note: resource_id foreign key removed to allow wildcard patterns like "/india/*"

    // Indexes
    table.index(["user_id", "org_id"]);
    table.index(["resource_id", "org_id"]);
    table.index("action");
  });

  // Create role_permission table
  await knex.schema.createTable("role_permission", (table) => {
    table.text("role_id").notNullable();
    table.text("org_id").notNullable();
    table.text("resource_id").notNullable();
    table.text("action").notNullable();
    table.integer("created_at").notNullable();

    // Composite primary key
    table.primary(["role_id", "org_id", "resource_id", "action"]);

    // Foreign keys
    table
      .foreign(["role_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("role")
      .onDelete("CASCADE");
    // Note: resource_id foreign key removed to allow wildcard patterns like "/india/*"

    // Indexes
    table.index(["role_id", "org_id"]);
    table.index(["resource_id", "org_id"]);
    table.index("action");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists("role_permission");
  await knex.schema.dropTableIfExists("user_permission");
  await knex.schema.dropTableIfExists("user_role");
  await knex.schema.dropTableIfExists("resource");
  await knex.schema.dropTableIfExists("user_property");
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("role_property");
  await knex.schema.dropTableIfExists("role");
  await knex.schema.dropTableIfExists("organization_property");
  await knex.schema.dropTableIfExists("organization");
}
