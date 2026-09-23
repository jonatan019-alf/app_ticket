require('dotenv').config(); // Carga las variables de entorno si no estaban cargadas
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar conexión al iniciar el servidor
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en la configuración del servidor SMTP:', error.message);
  } else {
    console.log('📧 Servidor SMTP de correo listo para enviar mensajes.');
  }
});

module.exports = transporter;
