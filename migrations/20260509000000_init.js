/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // 1. organizations
  await knex.schema.createTable('organizations', (t) => {
    t.uuid('id').primary();
    t.string('name').notNullable();
    t.text('description');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.enum('role', ['volunteer', 'org_admin', 'super_admin']).notNullable();
    t.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. events
  await knex.schema.createTable('events', (t) => {
    t.uuid('id').primary();
    t.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description');
    t.string('location');
    t.date('event_date').notNullable();
    t.time('start_time');
    t.time('end_time');
    t.integer('max_volunteers').defaultTo(10);
    t.enum('status', ['active', 'cancelled', 'completed']).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 4. applications
  await knex.schema.createTable('applications', (t) => {
    t.uuid('id').primary();
    t.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    t.uuid('volunteer_id').references('id').inTable('users').onDelete('CASCADE');
    t.text('application_text');
    t.text('ai_summary');
    t.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  return knex.schema
    .dropTableIfExists('applications')
    .dropTableIfExists('events')
    .dropTableIfExists('users')
    .dropTableIfExists('organizations');
}
