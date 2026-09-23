const pool = require('./src/config/db');

async function probarConexion() {
  console.log('Intentando conectar a la base de datos...');
  try {
    const res = await pool.query('SELECT NOW() AS hora_servidor;');
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    console.log('Hora del servidor Debian:', res.rows[0].hora_servidor);
  } catch (error) {
    console.error('❌ ERROR AL CONECTAR A LA BASE DE DATOS:');
    console.error(error.message);
  } finally {
    await pool.end();
    console.log('Pool de conexiones cerrado.');
  }
}

probarConexion();