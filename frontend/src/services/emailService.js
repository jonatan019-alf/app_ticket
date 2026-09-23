const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Confirmación de Ticket
const enviarConfirmacionTicket = async (datosTicket) => {
  const { 
    codigo_ticket, 
    email_contacto, 
    usuario_reporta, 
    titulo, 
    descripcion_problema, 
    prioridad 
  } = datosTicket;

  if (!email_contacto || email_contacto === 'sin_correo@ejemplo.com') return;

  const mailOptions = {
    from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
    to: email_contacto,
    subject: `Confirmación de Registro - Ticket #${codigo_ticket}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2b2b2b;">¡Hola, ${usuario_reporta}!</h2>
        <p style="color: #555;">Tu ticket de soporte ha sido ingresado al sistema con éxito.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        
        <h3 style="color: #333;">Resumen del Ticket</h3>
        <ul style="line-height: 1.8; color: #444;">
          <li><strong>Código de Seguimiento:</strong> <span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 4px;">#${codigo_ticket}</span></li>
          <li><strong>Asunto / Título:</strong> ${titulo}</li>
          <li><strong>Prioridad:</strong> ${prioridad}</li>
          <li><strong>Descripción:</strong> ${descripcion_problema}</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 0.85em; color: #888;">Este es un mensaje automático. Por favor, no respondas directamente a este correo.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Correo de confirmación enviado a ${email_contacto}`);
  } catch (error) {
    console.error('❌ Error al enviar el correo de confirmación:', error.message);
  }
};

// Envío de Informe Técnico con título dinámico
const enviarInformeTecnico = async (datosInforme) => {
  const { 
    email_contacto, 
    titulo, 
    nombre_area, 
    tecnico_nombre, 
    fecha_visita, 
    trabajo_realizado, 
    recomendaciones 
  } = datosInforme;

  if (!email_contacto || email_contacto === 'sin_correo@ejemplo.com') return;

  const mailOptions = {
    from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
    to: email_contacto,
    subject: `${titulo}`, // Hereda exactamente el título ingresado
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a365d; margin-top: 0;">${titulo}</h2>
        <p style="color: #555; font-size: 0.95em;">Se ha generado un nuevo informe técnico adjunto a su área.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; color: #444;">
          <tr>
            <td style="padding: 4px 0;"><strong>Área:</strong> ${nombre_area || 'N/A'}</td>
            <td style="padding: 4px 0;"><strong>Fecha de Visita:</strong> ${fecha_visita}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;" colspan="2"><strong>Técnico Interviniente:</strong> ${tecnico_nombre || 'Soporte Técnico'}</td>
          </tr>
        </table>

        <div style="margin-top: 15px;">
          <h4 style="color: #2b2b2b; margin-bottom: 5px;">Trabajo Realizado:</h4>
          <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; color: #333; white-space: pre-line;">${trabajo_realizado}</p>
        </div>

        ${recomendaciones ? `
        <div style="margin-top: 15px;">
          <h4 style="color: #2b2b2b; margin-bottom: 5px;">Recomendaciones / Observaciones:</h4>
          <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; color: #333; white-space: pre-line;">${recomendaciones}</p>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 0.85em; color: #888;">Mensaje generado automáticamente por el sistema de gestión de soporte.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Informe técnico enviado a ${email_contacto}`);
  } catch (error) {
    console.error('❌ Error al enviar el informe técnico:', error.message);
  }
};

module.exports = { 
  enviarConfirmacionTicket,
  enviarInformeTecnico 
};
// const nodemailer = require('nodemailer');

// // 1. Configuración del Transporter (usando variables de entorno)
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // O configura host, port según tu proveedor
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS  // Contraseña de Aplicación de 16 caracteres
//   }
// });

// // 2. Función para enviar la confirmación de ticket
// const enviarConfirmacionTicket = async (datosTicket) => {
//   const { 
//     codigo_ticket, 
//     email_contacto, 
//     usuario_reporta, 
//     titulo, 
//     descripcion_problema, 
//     prioridad 
//   } = datosTicket;

//   // Evitar envíos a emails nulos o por defecto
//   if (!email_contacto || email_contacto === 'sin_correo@ejemplo.com') {
//     return;
//   }

//   const mailOptions = {
//     from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
//     to: email_contacto,
//     subject: ` Confirmación de Registro - Ticket #${codigo_ticket}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//         <h2 style="color: #2b2b2b;">¡Hola, ${usuario_reporta}!</h2>
//         <p style="color: #555;">Tu ticket de soporte ha sido ingresado al sistema con éxito.</p>
//         <hr style="border: none; border-top: 1px solid #eee;" />
        
//         <h3 style="color: #333;">Resumen del Ticket</h3>
//         <ul style="line-height: 1.8; color: #444;">
//           <li><strong>Código de Seguimiento:</strong> <span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 4px;">#${codigo_ticket}</span></li>
//           <li><strong>Asunto / Título:</strong> ${titulo}</li>
//           <li><strong>Prioridad:</strong> ${prioridad}</li>
//           <li><strong>Descripción:</strong> ${descripcion_problema}</li>
//         </ul>
        
//         <hr style="border: none; border-top: 1px solid #eee;" />
//         <p style="font-size: 0.85em; color: #888;">Este es un mensaje automático. Por favor, no respondas directamente a este correo.</p>
//       </div>
//     `
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`📧 Correo de confirmación enviado a ${email_contacto}`);
//   } catch (error) {
//     console.error('❌ Error al enviar el correo de confirmación:', error.message);
//   }
// };

// module.exports = { enviarConfirmacionTicket };