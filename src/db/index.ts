import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'vms_db'
  },
  migrations: {
    directory: path.join(__dirname, '../../migrations'),
  },
  seeds: {
    directory: path.join(__dirname, '../../seeds'),
  }
});

export default db;
