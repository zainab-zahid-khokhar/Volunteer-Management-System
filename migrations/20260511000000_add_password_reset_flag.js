/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.table('users', (t) => {
    t.boolean('needs_password_reset').defaultTo(false);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.table('users', (t) => {
    t.dropColumn('needs_password_reset');
  });
}
