/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Drop data column from all tables that have it
  await knex.schema.alterTable("organization", (table) => {
    table.dropColumn("data");
  });

  await knex.schema.alterTable("role", (table) => {
    table.dropColumn("data");
  });

  await knex.schema.alterTable("user", (table) => {
    table.dropColumn("data");
  });

  await knex.schema.alterTable("resource", (table) => {
    table.dropColumn("data");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Re-add data column to all tables
  await knex.schema.alterTable("organization", (table) => {
    table.text("data");
  });

  await knex.schema.alterTable("role", (table) => {
    table.text("data");
  });

  await knex.schema.alterTable("user", (table) => {
    table.text("data");
  });

  await knex.schema.alterTable("resource", (table) => {
    table.text("data");
  });
}
