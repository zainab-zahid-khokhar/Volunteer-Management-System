import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  // Deleting existing data
  await knex('applications').del();
  await knex('events').del();
  await knex('users').del();
  await knex('organizations').del();

  // 1. Organizations
  const org1Id = uuidv4();
  const org2Id = uuidv4();
  await knex('organizations').insert([
    { id: org1Id, name: 'Green Earth Foundation', description: 'Environmental NGO focused on urban greening.' },
    { id: org2Id, name: 'Helping Hands', description: 'Community welfare organization.' }
  ]);

  // 2. Users (SuperAdmin, OrgAdmins, Volunteers)
  const superPassword = await bcrypt.hash('SuperAdmin@123', 12);
  const adminPassword = await bcrypt.hash('Password123', 12);
  const volunteerPassword = await bcrypt.hash('Password123', 12);

  const superAdminId = uuidv4();
  const orgAdmin1Id = uuidv4();
  const volunteer1Id = uuidv4();

  await knex('users').insert([
    {
      id: superAdminId,
      email: 'superadmin@vms.com',
      password_hash: superPassword,
      role: 'super_admin'
    },
    {
      id: orgAdmin1Id,
      email: 'admin@greenearth.org',
      password_hash: adminPassword,
      role: 'org_admin',
      organization_id: org1Id
    },
    {
      id: volunteer1Id,
      email: 'volunteer@test.com',
      password_hash: volunteerPassword,
      role: 'volunteer'
    }
  ]);

  // 3. Events
  const event1Id = uuidv4();
  const event2Id = uuidv4();
  await knex('events').insert([
    {
      id: event1Id,
      organization_id: org1Id,
      name: 'Karachi Beach Cleanup',
      description: 'Join us for a morning of cleaning Clifton Beach. Gloves and bags provided.',
      location: 'Clifton Beach, Karachi',
      event_date: '2026-05-20',
      start_time: '08:00',
      end_time: '12:00',
      max_volunteers: 20,
      status: 'active'
    },
    {
      id: event2Id,
      organization_id: org1Id,
      name: 'Tree Plantation Drive',
      description: 'Help us plant 500 trees in Gulshan-e-Iqbal park.',
      location: 'Gulshan-e-Iqbal Park',
      event_date: '2026-06-15',
      start_time: '07:30',
      end_time: '11:00',
      max_volunteers: 50,
      status: 'active'
    }
  ]);

  // 4. Applications
  await knex('applications').insert({
    id: uuidv4(),
    event_id: event1Id,
    volunteer_id: volunteer1Id,
    application_text: 'I have participated in multiple beach cleanups before and I am very passionate about marine life.',
    ai_summary: 'Experienced volunteer with a specific passion for marine conservation and coastline cleanup history.',
    status: 'pending'
  });
}
