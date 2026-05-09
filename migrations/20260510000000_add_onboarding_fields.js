/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.table('users', (t) => {
    t.boolean('onboarding_completed').defaultTo(false);
    t.string('full_name');
    t.string('phone');
    t.text('bio');
    t.text('skills'); // Comma separated or JSON
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.table('users', (t) => {
    t.dropColumn('onboarding_completed');
    t.dropColumn('full_name');
    t.dropColumn('phone');
    t.dropColumn('bio');
    t.dropColumn('skills');
  });
}
