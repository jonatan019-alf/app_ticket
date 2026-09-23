const path = require('path');
const transporter = require('../config/mailer');

// Definición de adjunto para la imagen con Content-ID
const attachments = [
  {
    filename: 'favicon.png',
    // Ajusta la ruta a donde se encuentre tu imagen en el backend (por ejemplo en public/logo.png o assets/logo.png)
    path: path.join(__dirname, '../../../frontend/public/favicon.png'),
    cid: 'logoEmpresa' // Debe coincidir con el src="cid:logoEmpresa" del HTML
  }
];

const enviarConfirmacionTicket = async (datosTicket) => {
  const { 
    codigo_ticket, 
    email_contacto, 
    usuario_reporta, 
    titulo, 
    descripcion_problema, 
    prioridad 
  } = datosTicket;

  if (!email_contacto || email_contacto === 'sin_correo@ejemplo.com') {
    return;
  }

  const mailOptions = {
    from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
    to: email_contacto,
    subject: `Confirmación de Registro - Ticket #${codigo_ticket}`,
    attachments,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
        
        <!-- Header con Logo y Título -->
        <div style="background-color: #1e293b; padding: 24px; text-align: center; border-bottom: 3px solid #2563eb;">
          <img src="cid:logoEmpresa" alt="Logo" style="height: 90px; width: auto; margin-bottom: 12px; display: inline-block;" />
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Soporte Técnico</h2>
        </div>

        <!-- Cuerpo del mensaje -->
        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0;">¡Hola, el ticket creado al usuario ${usuario_reporta}!</h3>
          <p style="color: #475569; line-height: 1.5;">Tu ticket de soporte ha sido ingresado al sistema correctamente y ya está asignado para revisión.</p>
          
          <!-- Contenedor Resumen -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Resumen del Ticket</h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 40%;">Código:</td>
                <td style="padding: 6px 0;"><span style="background-color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace;">#${codigo_ticket}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Asunto:</td>
                <td style="padding: 6px 0;">${titulo}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Prioridad:</td>
                <td style="padding: 6px 0;">${prioridad}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Descripción:</td>
                <td style="padding: 6px 0;">${descripcion_problema}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Te notificaremos por este medio en cuanto haya novedades sobre la resolución de tu requerimiento.</p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
        </div>
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

const enviarActualizacionTicket = async (datosTicket) => {
  const { 
    codigo_ticket, 
    email_contacto, 
    usuario_reporta, 
    titulo, 
    descripcion_problema,
    estado_actual,
    prioridad, 
    nota_tecnica 
  } = datosTicket;

  if (!email_contacto || email_contacto === 'sin_correo@ejemplo.com') {
    return;
  }

  const mailOptions = {
    from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
    to: email_contacto,
    subject: `Novedades sobre tu Ticket #${codigo_ticket || ''} - ${titulo || ''}`,
    attachments,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
        
        <!-- Header con Logo y Título -->
        <div style="background-color: #1e293b; padding: 24px; text-align: center; border-bottom: 3px solid #2563eb;">
          <img src="cid:logoEmpresa" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 12px; display: inline-block;" />
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Soporte Técnico</h2>
        </div>

        <!-- Cuerpo del mensaje -->
        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0;">¡Hola, ${usuario_reporta}!</h3>
          <p style="color: #475569; line-height: 1.5;">Se han registrado actualizaciones en tu ticket de soporte.</p>
          
          <!-- Contenedor Resumen -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Estado del Ticket</h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 40%;">Código:</td>
                <td style="padding: 6px 0;"><span style="background-color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace;">#${codigo_ticket}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Asunto:</td>
                <td style="padding: 6px 0;">${titulo}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Estado Actual:</td>
                <td style="padding: 6px 0;"><span style="color: #2563eb; font-weight: bold;">${estado_actual}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Prioridad:</td>
                <td style="padding: 6px 0;">${prioridad}</td>
              </tr>
            </table>
          </div>

          ${
            nota_tecnica 
              ? `<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-top: 20px;">
                   <strong style="color: #1e40af; font-size: 15px;">Observaciones / Respuesta Técnica:</strong>
                   <p style="margin-top: 8px; margin-bottom: 0; color: #1e293b; white-space: pre-line; line-height: 1.5;">${nota_tecnica}</p>
                 </div>`
              : ''
          }
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Correo de actualización enviado a ${email_contacto}`);
  } catch (error) {
    console.error('❌ Error al enviar el correo de actualización:', error.message);
  }
};

const enviarInformeTecnicoAlArea = async (informe) => {
  const {
    area_correo,
    area_nombre,
    tecnico_nombre,
    titulo,
    fecha_visita,
    trabajo_realizado,
    recomendaciones
  } = informe;

  if (!area_correo) {
    console.warn('⚠️ El área no tiene correo cargado. No se envió el informe técnico.');
    return;
  }

  const fechaTexto = fecha_visita
    ? new Date(fecha_visita).toLocaleDateString('es-AR')
    : '';

  const mailOptions = {
    from: `"Soporte Técnico" <${process.env.EMAIL_USER}>`,
    to: area_correo,
    subject: `Informe Técnico - ${titulo || area_nombre || ''}`,
    attachments,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
        <div style="background-color: #1e293b; padding: 24px; text-align: center; border-bottom: 3px solid #2563eb;">
          <img src="cid:logoEmpresa" alt="Logo" style="height: 90px; width: auto; margin-bottom: 12px; display: inline-block;" />
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Informe Técnico</h2>
        </div>

        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0;">Área: ${area_nombre || ''}</h3>
          <p style="color: #475569; line-height: 1.5;">Se registró un nuevo informe técnico para su dependencia.</p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 40%;">Título:</td>
                <td style="padding: 6px 0;">${titulo || ''}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Fecha de visita:</td>
                <td style="padding: 6px 0;">${fechaTexto}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Técnico:</td>
                <td style="padding: 6px 0;">${tecnico_nombre || ''}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 16px;">
            <strong style="color: #1e40af;">Trabajo realizado / Diagnóstico:</strong>
            <p style="white-space: pre-line; line-height: 1.5; color: #1e293b;">${trabajo_realizado || ''}</p>
          </div>

          ${
            recomendaciones
              ? `<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-top: 16px;">
                   <strong style="color: #1e40af;">Observaciones / Recomendaciones:</strong>
                   <p style="margin-top: 8px; margin-bottom: 0; color: #1e293b; white-space: pre-line; line-height: 1.5;">${recomendaciones}</p>
                 </div>`
              : ''
          }
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Informe técnico enviado al área ${area_nombre || ''} (${area_correo})`);
  } catch (error) {
    console.error('❌ Error al enviar el informe técnico al área:', error.message);
  }
};

module.exports = { 
  enviarConfirmacionTicket,
  enviarActualizacionTicket,
  enviarInformeTecnicoAlArea
};
