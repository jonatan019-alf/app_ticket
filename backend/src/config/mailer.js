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
// const nodemailer = require('nodemailer');

// // Se recomiendan variables de entorno (.env) para no dejar claves en el código
// // const transporter = nodemailer.createTransport({
// //   service: 'gmail',
// //   auth: {
// //     user: process.env.EMAIL_USER, // Tu correo de Gmail (ej: soporte@gmail.com)
// //     pass: process.env.EMAIL_PASS  // La contraseña de aplicación de 16 caracteres
// //   }
// // });
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, // Ej: smtp.municipio.gob.ar
//   port: process.env.SMTP_PORT, // Ej: 587 (TLS/STARTTLS) o 465 (SSL)
//   secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
//   auth: {
//     user: process.env.EMAIL_USER, // Ej: soporte@municipio.gob.ar
//     pass: process.env.EMAIL_PASS  // La contraseña institucional de la casilla
//  },
//   tls: {
//    rejectUnauthorized: false // Útil si el servidor de la municipalidad usa certificados autofirmados
//   }
// });

// // Verificar conexión con el servidor SMTP al arrancar
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('❌ Error en la configuración del servidor de correo:', error);
//   } else {
//     console.log('📧 Servidor SMTP de correo listo para enviar mensajes.');
//   }
// });

// module.exports = transporter;