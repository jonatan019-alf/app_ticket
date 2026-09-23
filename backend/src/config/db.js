const { Pool } = require('pg');
const path = require('path');

// Esto fuerza a buscar el archivo .env en la raíz del proyecto backend
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log("Cargando DB_HOST desde env:", process.env.DB_HOST); // <-- Agrega este log para verificar

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('⚡ Conectado exitosamente a PostgreSQL en Debian');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
