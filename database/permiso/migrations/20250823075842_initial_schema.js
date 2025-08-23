/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create organization table
  await knex.schema.createTable("organization", (table) => {
    table.string("id", 255).primary();
    table.string("name", 255).notNullable().defaultTo("");
    table.text("description");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index("created_at");
    table.index("name");
  });

  // Create organization_property table
  await knex.schema.createTable("organization_property", (table) => {
    table.string("parent_id", 255).notNullable();
    table.string("name", 255).notNullable();
    table.jsonb("value").notNullable();
    table.boolean("hidden").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

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
    table.index(["name", "value"]);
    table.index("value", null, "gin");
  });

  // Create role table
  await knex.schema.createTable("role", (table) => {
    table.string("id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("name", 255).notNullable().defaultTo("");
    table.text("description");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

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
    table.string("parent_id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("name", 255).notNullable();
    table.jsonb("value").notNullable();
    table.boolean("hidden").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

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
    table.index(["name", "value"]);
    table.index("value", null, "gin");
  });

  // Create user table
  await knex.schema.createTable("user", (table) => {
    table.string("id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("identity_provider", 255).notNullable();
    table.string("identity_provider_user_id", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

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
    table.string("parent_id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("name", 255).notNullable();
    table.jsonb("value").notNullable();
    table.boolean("hidden").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

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
    table.index(["name", "value"]);
    table.index("value", null, "gin");
  });

  // Create resource table
  await knex.schema.createTable("resource", (table) => {
    table.string("id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("name", 255);
    table.text("description");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

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
    table.string("user_id", 255).notNullable();
    table.string("role_id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

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
    table.string("user_id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("resource_id", 255).notNullable();
    table.string("action", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Composite primary key
    table.primary(["user_id", "org_id", "resource_id", "action"]);

    // Foreign keys
    table
      .foreign(["user_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("user")
      .onDelete("CASCADE");
    table
      .foreign(["resource_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("resource")
      .onDelete("CASCADE");

    // Indexes
    table.index(["user_id", "org_id"]);
    table.index(["resource_id", "org_id"]);
    table.index("action");
  });

  // Create role_permission table
  await knex.schema.createTable("role_permission", (table) => {
    table.string("role_id", 255).notNullable();
    table.string("org_id", 255).notNullable();
    table.string("resource_id", 255).notNullable();
    table.string("action", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Composite primary key
    table.primary(["role_id", "org_id", "resource_id", "action"]);

    // Foreign keys
    table
      .foreign(["role_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("role")
      .onDelete("CASCADE");
    table
      .foreign(["resource_id", "org_id"])
      .references(["id", "org_id"])
      .inTable("resource")
      .onDelete("CASCADE");

    // Indexes
    table.index(["role_id", "org_id"]);
    table.index(["resource_id", "org_id"]);
    table.index("action");
  });

  // Add the special text_pattern_ops index for resource.id
  await knex.raw(
    'CREATE INDEX "resource_id text_pattern_ops_index" ON "resource" ("id" text_pattern_ops)',
  );
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
