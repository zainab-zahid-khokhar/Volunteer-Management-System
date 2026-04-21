const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@vms.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

  const existing = await knex('users').where({ email }).first();
  if (existing) return;

  const superAdminId = uuidv4();
  const password_hash = await bcrypt.hash(password, 12);

  // Super admin doesn't belong to an org, so we create a placeholder org first
  // or just insert without org
  await knex('users').insert({
    id: superAdminId,
    email,
    password_hash,
    role: 'super_admin',
    email_verified: true,
    organization_id: null,
    is_active: true,
  });

  console.log(`✅ Super Admin seeded: ${email}`);
};
