'use strict';

// Konfigurasi database untuk Sequelize CLI (migrate, seed, dll)
// Menggunakan DATABASE_URL dari .env
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const url = new URL(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/inventory_db');

module.exports = {
  development: {
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    host: url.hostname,
    port: url.port || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    host: url.hostname,
    port: url.port || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Diperlukan untuk AWS RDS
      },
    },
  },
};
