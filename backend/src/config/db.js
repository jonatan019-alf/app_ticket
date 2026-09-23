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
// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// pool.on('connect', () => {
//   console.log('⚡ Conectado exitosamente a PostgreSQL en Debian');
// });

// pool.on('error', (err) => {
//   console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
//   process.exit(-1);
// });

// // --- PRUEBA DE CONEXIÓN RÁPIDA ---
// console.log(`Intentando conectar a DB_HOST: ${process.env.DB_HOST}...`);

// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('❌ Error al conectar a la Base de Datos:', err.message);
//   } else {
//     console.log('✅ Conexión exitosa. Hora del servidor DB:', res.rows[0].now);
//   }
//   pool.end(); // Cerramos el pool para que el script termine solo
// });

// module.exports = pool;

// const { Pool } = require('pg');
// require('dotenv').config(); 

// // Configuramos el pool de conexiones usando las variables de entorno
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   //port: parseInt(process.env.DB_PORT, 10) || 5432, // Aseguramos que el puerto sea un número
//   port:process.env.DB_PORT,
// });

// // Eventos opcionales pero muy recomendados para monitorear la conexión en la consola
// pool.on('connect', () => {
//   console.log(' Conectado exitosamente a PostgreSQL en Debian');
// });

// pool.on('error', (err) => {
//   console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
//   process.exit(-1);
// });

// module.exports = pool;