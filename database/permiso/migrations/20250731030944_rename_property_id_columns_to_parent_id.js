export const up = async (knex) => {
  // Rename org_id to parent_id in organization_property table
  await knex.schema.alterTable('organization_property', (table) => {
    table.renameColumn('org_id', 'parent_id');
  });

  // Rename user_id to parent_id in user_property table
  await knex.schema.alterTable('user_property', (table) => {
    table.renameColumn('user_id', 'parent_id');
  });

  // Rename role_id to parent_id in role_property table
  await knex.schema.alterTable('role_property', (table) => {
    table.renameColumn('role_id', 'parent_id');
  });

  // Update foreign key constraints
  // For organization_property
  await knex.raw(`
    ALTER TABLE organization_property
    DROP CONSTRAINT organization_property_org_id_foreign,
    ADD CONSTRAINT organization_property_parent_id_foreign
      FOREIGN KEY (parent_id) REFERENCES organization(id) ON DELETE CASCADE
  `);

  // For user_property
  await knex.raw(`
    ALTER TABLE user_property
    DROP CONSTRAINT user_property_user_id_org_id_foreign,
    ADD CONSTRAINT user_property_parent_id_org_id_foreign
      FOREIGN KEY (parent_id, org_id) REFERENCES "user"(id, org_id) ON DELETE CASCADE
  `);

  // For role_property
  await knex.raw(`
    ALTER TABLE role_property
    DROP CONSTRAINT role_property_role_id_org_id_foreign,
    ADD CONSTRAINT role_property_parent_id_org_id_foreign
      FOREIGN KEY (parent_id, org_id) REFERENCES role(id, org_id) ON DELETE CASCADE
  `);
};

export const down = async (knex) => {
  // Rename parent_id back to org_id in organization_property table
  await knex.schema.alterTable('organization_property', (table) => {
    table.renameColumn('parent_id', 'org_id');
  });

  // Rename parent_id back to user_id in user_property table
  await knex.schema.alterTable('user_property', (table) => {
    table.renameColumn('parent_id', 'user_id');
  });

  // Rename parent_id back to role_id in role_property table
  await knex.schema.alterTable('role_property', (table) => {
    table.renameColumn('parent_id', 'role_id');
  });

  // Restore original foreign key constraints
  // For organization_property
  await knex.raw(`
    ALTER TABLE organization_property
    DROP CONSTRAINT organization_property_parent_id_foreign,
    ADD CONSTRAINT organization_property_org_id_foreign
      FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE
  `);

  // For user_property
  await knex.raw(`
    ALTER TABLE user_property
    DROP CONSTRAINT user_property_parent_id_org_id_foreign,
    ADD CONSTRAINT user_property_user_id_org_id_foreign
      FOREIGN KEY (user_id, org_id) REFERENCES "user"(id, org_id) ON DELETE CASCADE
  `);

  // For role_property
  await knex.raw(`
    ALTER TABLE role_property
    DROP CONSTRAINT role_property_parent_id_org_id_foreign,
    ADD CONSTRAINT role_property_role_id_org_id_foreign
      FOREIGN KEY (role_id, org_id) REFERENCES role(id, org_id) ON DELETE CASCADE
  `);
};