/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  // Enable uuid-ossp extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // 1. users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('email', 255).unique().notNullable();
    t.string('password_hash', 255).notNullable();
    t.enu('role', ['volunteer', 'org_admin', 'super_admin']).notNullable();
    t.boolean('email_verified').defaultTo(false);
    t.uuid('organization_id').nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // 2. organizations
  await knex.schema.createTable('organizations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.text('description').nullable();
    t.boolean('is_active').defaultTo(true);
    t.uuid('onboarded_by').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // FK: users.organization_id → organizations.id
  await knex.schema.alterTable('users', (t) => {
    t.foreign('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
  });

  // FK: organizations.onboarded_by → users.id
  await knex.schema.alterTable('organizations', (t) => {
    t.foreign('onboarded_by').references('id').inTable('users');
  });

  // 3. invite_tokens
  await knex.schema.createTable('invite_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.string('email', 255).notNullable();
    t.string('token', 255).unique().notNullable();
    t.boolean('is_used').defaultTo(false);
    t.timestamp('expires_at').notNullable();
    t.uuid('created_by').notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 4. volunteer_profiles
  await knex.schema.createTable('volunteer_profiles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').unique().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('phone', 20).nullable();
    t.specificType('skills', 'TEXT[]').nullable();
    t.specificType('interests', 'TEXT[]').nullable();
    t.text('bio').nullable();
    t.string('profile_image_url', 500).nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // 5. events
  await knex.schema.createTable('events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('description').nullable();
    t.string('location', 255).nullable();
    t.date('event_date').notNullable();
    t.time('start_time').notNullable();
    t.time('end_time').notNullable();
    t.integer('max_volunteers').notNullable();
    t.enu('status', ['active', 'cancelled', 'completed']).defaultTo('active');
    t.uuid('created_by').notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // 6. applications
  await knex.schema.createTable('applications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('volunteer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    t.text('application_text').notNullable();
    t.enu('status', ['pending', 'accepted', 'rejected', 'closed']).defaultTo('pending');
    t.uuid('reviewed_by').nullable().references('id').inTable('users');
    t.timestamp('reviewed_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['volunteer_id', 'event_id']);
  });

  // 7. ai_summaries
  await knex.schema.createTable('ai_summaries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('application_id').unique().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.text('summary_text').notNullable();
    t.string('model_version', 50).nullable();
    t.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
  });

  // 8. messages
  await knex.schema.createTable('messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('recipient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('content').notNullable();
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 9. notifications
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('type', ['event_reminder', 'application_update', 'message', 'general']).notNullable();
    t.uuid('reference_id').nullable();
    t.string('title', 255).notNullable();
    t.text('body').nullable();
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 10. audit_logs
  await knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('action', 100).notNullable();
    t.string('resource_type', 50).notNullable();
    t.uuid('resource_id').nullable();
    t.jsonb('details').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // email_verification_tokens
  await knex.schema.createTable('email_verification_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token', 255).unique().notNullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.raw('CREATE INDEX idx_users_email ON users(email)');
  await knex.raw('CREATE INDEX idx_users_org_id ON users(organization_id)');
  await knex.raw('CREATE INDEX idx_events_org_id ON events(organization_id)');
  await knex.raw('CREATE INDEX idx_events_status ON events(status)');
  await knex.raw('CREATE INDEX idx_applications_volunteer ON applications(volunteer_id)');
  await knex.raw('CREATE INDEX idx_applications_event ON applications(event_id)');
  await knex.raw('CREATE INDEX idx_applications_status ON applications(status)');
  await knex.raw('CREATE INDEX idx_notifications_user ON notifications(user_id)');
  await knex.raw('CREATE INDEX idx_messages_sender ON messages(sender_id)');
  await knex.raw('CREATE INDEX idx_messages_recipient ON messages(recipient_id)');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('email_verification_tokens');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('ai_summaries');
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('volunteer_profiles');
  await knex.schema.dropTableIfExists('invite_tokens');
  await knex.schema.alterTable('users', (t) => { t.dropForeign(['organization_id']); });
  await knex.schema.dropTableIfExists('organizations');
  await knex.schema.dropTableIfExists('users');
};
