import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:3001/api';

const HistorialGlobal = () => {
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);

  // Estado para el ticket seleccionado
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Estados para los campos editables del ticket
  const [formEstado, setFormEstado] = useState('');
  const [formPrioridad, setFormPrioridad] = useState('');
  const [formTecnico, setFormTecnico] = useState('');
  const [formInconveniente, setFormInconveniente] = useState('');
  const [formSolucion, setFormSolucion] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estados de los Filtros
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/tecnicos`)
      .then(res => setTecnicos(res.data))
      .catch(err => console.error('Error al cargar técnicos:', err));
  }, []);

  const handleBuscar = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHaBuscado(true);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/tickets`);

      const resultados = data.filter(ticket => {
        const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
        const matchUsuario = !filtroUsuario || 
          ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
          ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
        const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
        const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
        const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

        return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
      });

      setTickets(resultados);
    } catch (error) {
      console.error('Error al realizar la consulta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFiltroCodigo('');
    setFiltroUsuario('');
    setFiltroEstado('');
    setFiltroTecnico('');
    setFiltroPrioridad('');
    setTickets([]);
    setHaBuscado(false);
  };

  // Abrir vista de detalle
  const handleAbrirTicket = (ticket) => {
    setTicketSeleccionado(ticket);
    setFormEstado(ticket.estado_actual || ticket.estado || 'ABIERTO');
    setFormPrioridad(ticket.prioridad || 'MEDIA');
    setFormTecnico(ticket.asignado_a_tecnico_id ?? ticket.tecnico_id ?? '');
    setFormInconveniente(ticket.descripcion_problema || ticket.inconveniente || '');
    setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
  };

  // Evalúa si algún campo editable sufrió cambios
  const hayCambios = () => {
    if (!ticketSeleccionado) return false;

    const estadoOrig = ticketSeleccionado.estado_actual || ticketSeleccionado.estado || 'ABIERTO';
    const prioridadOrig = ticketSeleccionado.prioridad || 'MEDIA';
    const tecnicoOrig = String(ticketSeleccionado.asignado_a_tecnico_id ?? ticketSeleccionado.tecnico_id ?? '');
    const inconvOrig = ticketSeleccionado.descripcion_problema || ticketSeleccionado.inconveniente || '';
    const solucionOrig = ticketSeleccionado.nota_tecnica || ticketSeleccionado.solucion || '';

    return (
      formEstado !== estadoOrig ||
      formPrioridad !== prioridadOrig ||
      String(formTecnico) !== tecnicoOrig ||
      formInconveniente !== inconvOrig ||
      formSolucion !== solucionOrig
    );
  };

  // Función auxiliar para cargar imagen en Base64 para jsPDF
  const cargarImagen = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
    });
  };

  // Generar y Descargar PDF con Logo
  const handleDescargarPDF = async (ticket) => {
    if (!ticket) return;

    try {
      const doc = new jsPDF();
      let startY = 20;

      // Intentar cargar el logo desde la carpeta pública (ej. /favicon.png)
      try {
        const logoBase64 = await cargarImagen('/favicon.png');
        // doc.addImage(imagenData, formato, x, y, ancho, alto)
        doc.addImage(logoBase64, 'PNG', 14, 12, 24, 24);
        startY = 42; // Desplazar tablas si existe el logo
      } catch (e) {
        console.warn('No se pudo cargar la imagen del logo en el PDF:', e);
      }

      // Título principal del Ticket
      doc.setFontSize(16);
      doc.setTextColor(0, 150, 136);
      doc.text(`Ticket #${ticket.codigo_ticket || ticket.id}`, 44, 25);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Reporte generado: ${new Date().toLocaleDateString('es-AR')}`, 44, 32);

      autoTable(doc, {
        startY: startY,
        head: [['Solicitante', 'Email', 'Área', 'Categoría']],
        body: [
          [
            ticket.usuario_reporta || ticket.solicitante || '-',
            ticket.email_contacto || ticket.email || '-',
            ticket.area_nombre || ticket.area || 'N/A',
            ticket.categoria_nombre || ticket.categoria || 'N/A'
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [39, 39, 42] }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Estado', 'Prioridad', 'Asunto']],
        body: [
          [
            formEstado || ticket.estado_actual || 'N/A',
            formPrioridad || ticket.prioridad || 'N/A',
            ticket.titulo || ticket.asunto || '-'
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [39, 39, 42] }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Inconveniente Reportado']],
        body: [[formInconveniente || 'Sin detalle de inconveniente']],
        theme: 'grid',
        headStyles: { fillColor: [39, 39, 42] }
      });

      if (formSolucion) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['Solución / Observaciones Técnicas']],
          body: [[formSolucion]],
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      doc.save(`Ticket_${ticket.codigo_ticket || ticket.id}.pdf`);
    } catch (err) {
      console.error('Error generando el PDF:', err);
      alert('Ocurrió un error al generar el PDF. Verifica los datos.');
    }
  };

  // Guardar modificaciones
  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    if (!ticketSeleccionado || !hayCambios()) return;

    setGuardando(true);
    try {
      const payload = {
        estado_actual: formEstado,
        prioridad: formPrioridad,
        asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
        descripcion_problema: formInconveniente,
        nota_tecnica: formSolucion
      };

      const { data } = await axios.put(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}`, payload);
      
      const ticketRespuesta = data.ticket || data;

      const ticketActualizado = {
        ...ticketSeleccionado,
        ...ticketRespuesta,
        estado_actual: formEstado,
        prioridad: formPrioridad,
        asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
        descripcion_problema: formInconveniente,
        nota_tecnica: formSolucion
      };

      setTicketSeleccionado(ticketActualizado);
      setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
      
      alert('Ticket actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el ticket:', error);
      alert('Ocurrió un error al intentar guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const existeModificacion = hayCambios();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {ticketSeleccionado ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* BARRA DE BOTONES SUPERIORES */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setTicketSeleccionado(null)}
              style={btnSecondaryStyle}
            >
              Volver al Listado de Tickets
            </button>
          </div>

          {/* TARJETA 1: DATOS DEL SOLICITANTE */}
          <div style={cardBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
                  #{ticketSeleccionado.codigo_ticket || ticketSeleccionado.id}
                </span>
                <span style={{ ...badgeStyle, backgroundColor: formEstado === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
                  {formEstado.replace('_', ' ')}
                </span>
                <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
                  {formPrioridad}
                </span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#9ca3af' }}>Solicitante: </span>
                <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta || ticketSeleccionado.solicitante || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Email: </span>
                <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto || ticketSeleccionado.email || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Área: </span>
                <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Categoría: </span>
                <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria || 'N/A'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                Asunto:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5' }}>
                {ticketSeleccionado.titulo || ticketSeleccionado.asunto || '-'}
              </div>
            </div>
          </div>

          {/* TARJETA 2: GESTIÓN DE TICKET */}
          <div style={cardBoxStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
              Gestionar Ticket
            </h3>

            <form onSubmit={handleGuardarCambios}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="EN_PROGRESO">EN PROGRESO</option>
                    <option value="ESCALADO">ESCALADO</option>
                    <option value="RESUELTO">RESUELTO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Prioridad</label>
                  <select
                    value={formPrioridad}
                    onChange={(e) => setFormPrioridad(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="CRITICA">CRÍTICA</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Técnico Asignado</label>
                  <select
                    value={formTecnico}
                    onChange={(e) => setFormTecnico(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {tecnicos.map(tec => (
                      <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* CAMPO INCONVENIENTE */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, textAlign: 'center' }}>INCONVENIENTE</label>
                <textarea
                  rows="3"
                  value={formInconveniente}
                  onChange={(e) => setFormInconveniente(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Detalle del inconveniente del usuario..."
                />
              </div>

              {/* CAMPO SOLUCIÓN / OBSERVACIONES TÉCNICAS */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
                <textarea
                  rows="4"
                  placeholder="Describa la solución aplicada o notas de seguimiento..."
                  value={formSolucion}
                  onChange={(e) => setFormSolucion(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => handleDescargarPDF(ticketSeleccionado)}
                  style={{
                    ...btnPrimaryStyle,
                    backgroundColor: '#198754'
                  }}
                >
                  📄 Descargar PDF
                </button>

                <button
                  type="submit"
                  disabled={guardando || !existeModificacion}
                  style={{
                    ...btnPrimaryStyle,
                    opacity: (guardando || !existeModificacion) ? 0.4 : 1,
                    cursor: (guardando || !existeModificacion) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : '💾 Guardar Cambios!!'}
                </button>
              </div>
            </form>
          </div>

        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
              Gestión Global de Tickets
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
              Aplique los filtros necesarios para consultar las solicitudes registradas.
            </p>
          </div>

          <div style={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}>
            <form onSubmit={handleBuscar}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={labelStyle}>Código Ticket</label>
                  <input
                    type="text"
                    placeholder="Ej: TCK-790878"
                    value={filtroCodigo}
                    onChange={(e) => setFiltroCodigo(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Usuario / Título</label>
                  <input
                    type="text"
                    placeholder="Buscar por texto..."
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Todos --</option>
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="EN_PROGRESO">EN PROGRESO</option>
                    <option value="ESCALADO">ESCALADO</option>
                    <option value="RESUELTO">RESUELTO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Técnico</label>
                  <select
                    value={filtroTecnico}
                    onChange={(e) => setFiltroTecnico(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Todos --</option>
                    {tecnicos.map(tec => (
                      <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Prioridad</label>
                  <select
                    value={filtroPrioridad}
                    onChange={(e) => setFiltroPrioridad(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Todas --</option>
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="CRITICA">CRÍTICA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleLimpiar}
                  style={btnSecondaryStyle}
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...btnPrimaryStyle,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Buscando...' : '🔍 Consultar'}
                </button>
              </div>
            </form>
          </div>

          {!haBuscado ? (
            <div style={placeholderBoxStyle}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
              <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
              <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
                Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
              </p>
            </div>
          ) : loading ? (
            <div style={placeholderBoxStyle}>
              <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={placeholderBoxStyle}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
              <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
              <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
                No se encontraron tickets con los parámetros indicados.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
                Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleAbrirTicket(ticket)}
                    style={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '10px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease-in-out',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.03em' }}>
                      #{ticket.codigo_ticket || ticket.id}
                    </div>

                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f4f4f5', lineHeight: '1.4' }}>
                      {ticket.titulo || ticket.asunto}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

// ESTILOS
const cardBoxStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
};

const labelStyle = {
  display: 'block',
  color: '#a1a1aa',
  fontSize: '0.78rem',
  fontWeight: '600',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '6px',
  color: '#f4f4f5',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const badgeStyle = {
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '700'
};

const btnPrimaryStyle = {
  padding: '10px 20px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: '600',
  fontSize: '0.875rem',
  transition: 'background-color 0.2s',
  cursor: 'pointer'
};

const btnSecondaryStyle = {
  padding: '9px 16px',
  backgroundColor: '#27272a',
  color: '#e4e4e7',
  border: '1px solid #3f3f46',
  borderRadius: '6px',
  fontWeight: '500',
  fontSize: '0.875rem',
  cursor: 'pointer'
};

const placeholderBoxStyle = {
  backgroundColor: '#18181b',
  border: '2px dashed #27272a',
  borderRadius: '12px',
  padding: '48px 20px',
  textAlign: 'center',
  color: '#a1a1aa'
};

export default HistorialGlobal;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// const API_BASE_URL = 'http://localhost:5000/api';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formInconveniente, setFormInconveniente] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     axios.get(`${API_BASE_URL}/tecnicos`)
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get(`${API_BASE_URL}/tickets`);

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || ticket.estado || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id ?? ticket.tecnico_id ?? '');
    
//     // Inconveniente: Toma la descripción del problema registrada
//     setFormInconveniente(ticket.descripcion_problema || ticket.inconveniente || '');

//     // Solución: Únicamente toma la nota técnica o solución cargada (o vacío)
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Evalúa si algún campo editable sufrió cambios respecto a la versión guardada
//   const hayCambios = () => {
//     if (!ticketSeleccionado) return false;

//     const estadoOrig = ticketSeleccionado.estado_actual || ticketSeleccionado.estado || 'ABIERTO';
//     const prioridadOrig = ticketSeleccionado.prioridad || 'MEDIA';
//     const tecnicoOrig = String(ticketSeleccionado.asignado_a_tecnico_id ?? ticketSeleccionado.tecnico_id ?? '');
//     const inconvOrig = ticketSeleccionado.descripcion_problema || ticketSeleccionado.inconveniente || '';
//     const solucionOrig = ticketSeleccionado.nota_tecnica || ticketSeleccionado.solucion || '';

//     return (
//       formEstado !== estadoOrig ||
//       formPrioridad !== prioridadOrig ||
//       String(formTecnico) !== tecnicoOrig ||
//       formInconveniente !== inconvOrig ||
//       formSolucion !== solucionOrig
//     );
//   };

//   // Generar y Descargar PDF
//   const handleDescargarPDF = (ticket) => {
//     if (!ticket) return;

//     try {
//       const doc = new jsPDF();

//       doc.setFontSize(16);
//       doc.setTextColor(0, 150, 136);
//       doc.text(`Ticket #${ticket.codigo_ticket || ticket.id}`, 14, 20);

//       autoTable(doc, {
//         startY: 28,
//         head: [['Solicitante', 'Email', 'Área', 'Categoría']],
//         body: [
//           [
//             ticket.usuario_reporta || ticket.solicitante || '-',
//             ticket.email_contacto || ticket.email || '-',
//             ticket.area_nombre || ticket.area || 'N/A',
//             ticket.categoria_nombre || ticket.categoria || 'N/A'
//           ]
//         ],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       autoTable(doc, {
//         startY: doc.lastAutoTable.finalY + 8,
//         head: [['Estado', 'Prioridad', 'Asunto']],
//         body: [
//           [
//             formEstado || ticket.estado_actual || 'N/A',
//             formPrioridad || ticket.prioridad || 'N/A',
//             ticket.titulo || ticket.asunto || '-'
//           ]
//         ],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       autoTable(doc, {
//         startY: doc.lastAutoTable.finalY + 8,
//         head: [['Inconveniente Reportado']],
//         body: [[formInconveniente || 'Sin detalle de inconveniente']],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       if (formSolucion) {
//         autoTable(doc, {
//           startY: doc.lastAutoTable.finalY + 8,
//           head: [['Solución / Observaciones Técnicas']],
//           body: [[formSolucion]],
//           theme: 'grid',
//           headStyles: { fillColor: [16, 185, 129] }
//         });
//       }

//       doc.save(`Ticket_${ticket.codigo_ticket || ticket.id}.pdf`);
//     } catch (err) {
//       console.error('Error generando el PDF:', err);
//       alert('Ocurrió un error al generar el PDF. Verifica los datos.');
//     }
//   };

//   // Guardar modificaciones
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado || !hayCambios()) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketRespuesta = data.ticket || data;

//       const ticketActualizado = {
//         ...ticketSeleccionado,
//         ...ticketRespuesta,
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       setTicketSeleccionado(ticketActualizado);
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
      
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   const existeModificacion = hayCambios();

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* BARRA DE BOTONES SUPERIORES */}
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
//             <button
//               type="button"
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               Volver al Listado de Tickets
//             </button>

//             {/* <button
//               type="button"
//               onClick={() => handleDescargarPDF(ticketSeleccionado)}
//               style={{
//                 ...btnSecondaryStyle,
//                 backgroundColor: '#198754',
//                 borderColor: '#198754',
//                 color: '#ffffff',
//                 fontWeight: 'bold'
//               }}
//             >
//               📄 Descargar PDF
//             </button> */}
//           </div>

//           {/* TARJETA 1: DATOS DEL SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket || ticketSeleccionado.id}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: formEstado === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {formEstado.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {formPrioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta || ticketSeleccionado.solicitante || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto || ticketSeleccionado.email || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5' }}>
//                 {ticketSeleccionado.titulo || ticketSeleccionado.asunto || '-'}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* CAMPO INCONVENIENTE */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>INCONVENIENTE</label>
//                 <textarea
//                   rows="3"
//                   value={formInconveniente}
//                   onChange={(e) => setFormInconveniente(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                   placeholder="Detalle del inconveniente del usuario..."
//                 />
//               </div>

//               {/* CAMPO SOLUCIÓN / OBSERVACIONES TÉCNICAS */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
//                 <button
//                   type="button"
//                   onClick={() => handleDescargarPDF(ticketSeleccionado)}
//                   style={{
//                     ...btnPrimaryStyle,
//                     backgroundColor: '#198754'
//                   }}
//                 >
//                   📄 Descargar PDF
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={guardando || !existeModificacion}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: (guardando || !existeModificacion) ? 0.4 : 1,
//                     cursor: (guardando || !existeModificacion) ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios!!'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         <>
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: loading ? 0.7 : 1,
//                     cursor: loading ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {loading ? 'Buscando...' : '🔍 Consultar'}
//                 </button>
//               </div>
//             </form>
//           </div>

//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.03em' }}>
//                       #{ticket.codigo_ticket || ticket.id}
//                     </div>

//                     <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f4f4f5', lineHeight: '1.4' }}>
//                       {ticket.titulo || ticket.asunto}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   transition: 'background-color 0.2s',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// const API_BASE_URL = 'http://localhost:5000/api';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formInconveniente, setFormInconveniente] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     axios.get(`${API_BASE_URL}/tecnicos`)
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get(`${API_BASE_URL}/tickets`);

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || ticket.estado || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id ?? ticket.tecnico_id ?? '');
    
//     // Inconveniente: Toma la descripción del problema registrada
//     setFormInconveniente(ticket.descripcion_problema || ticket.inconveniente || '');

//     // Solución: Únicamente toma la nota técnica o solución cargada (o vacío)
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Generar y Descargar PDF
//   const handleDescargarPDF = (ticket) => {
//     if (!ticket) return;

//     try {
//       const doc = new jsPDF();

//       doc.setFontSize(16);
//       doc.setTextColor(0, 150, 136);
//       doc.text(`Ticket #${ticket.codigo_ticket || ticket.id}`, 14, 20);

//       autoTable(doc, {
//         startY: 28,
//         head: [['Solicitante', 'Email', 'Área', 'Categoría']],
//         body: [
//           [
//             ticket.usuario_reporta || ticket.solicitante || '-',
//             ticket.email_contacto || ticket.email || '-',
//             ticket.area_nombre || ticket.area || 'N/A',
//             ticket.categoria_nombre || ticket.categoria || 'N/A'
//           ]
//         ],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       autoTable(doc, {
//         startY: doc.lastAutoTable.finalY + 8,
//         head: [['Estado', 'Prioridad', 'Asunto']],
//         body: [
//           [
//             formEstado || ticket.estado_actual || 'N/A',
//             formPrioridad || ticket.prioridad || 'N/A',
//             ticket.titulo || ticket.asunto || '-'
//           ]
//         ],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       autoTable(doc, {
//         startY: doc.lastAutoTable.finalY + 8,
//         head: [['Inconveniente Reportado']],
//         body: [[formInconveniente || 'Sin detalle de inconveniente']],
//         theme: 'grid',
//         headStyles: { fillColor: [39, 39, 42] }
//       });

//       if (formSolucion) {
//         autoTable(doc, {
//           startY: doc.lastAutoTable.finalY + 8,
//           head: [['Solución / Observaciones Técnicas']],
//           body: [[formSolucion]],
//           theme: 'grid',
//           headStyles: { fillColor: [16, 185, 129] }
//         });
//       }

//       doc.save(`Ticket_${ticket.codigo_ticket || ticket.id}.pdf`);
//     } catch (err) {
//       console.error('Error generando el PDF:', err);
//       alert('Ocurrió un error al generar el PDF. Verifica los datos.');
//     }
//   };

//   // Guardar modificaciones
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketRespuesta = data.ticket || data;

//       const ticketActualizado = {
//         ...ticketSeleccionado,
//         ...ticketRespuesta,
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       setTicketSeleccionado(ticketActualizado);
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
      
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* BARRA DE BOTONES SUPERIORES */}
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
//             <button
//               type="button"
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               ← Volver al Listado de Tickets
//             </button>

//             <button
//               type="button"
//               onClick={() => handleDescargarPDF(ticketSeleccionado)}
//               style={{
//                 ...btnSecondaryStyle,
//                 backgroundColor: '#198754',
//                 borderColor: '#198754',
//                 color: '#ffffff',
//                 fontWeight: 'bold'
//               }}
//             >
//               📄 Descargar PDF
//             </button>
//           </div>

//           {/* TARJETA 1: DATOS DEL SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket || ticketSeleccionado.id}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: formEstado === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {formEstado.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {formPrioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta || ticketSeleccionado.solicitante || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto || ticketSeleccionado.email || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5' }}>
//                 {ticketSeleccionado.titulo || ticketSeleccionado.asunto || '-'}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* CAMPO INCONVENIENTE */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>INCONVENIENTE</label>
//                 <textarea
//                   rows="3"
//                   value={formInconveniente}
//                   onChange={(e) => setFormInconveniente(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                   placeholder="Detalle del inconveniente del usuario..."
//                 />
//               </div>

//               {/* CAMPO SOLUCIÓN / OBSERVACIONES TÉCNICAS */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
//                 <button
//                   type="button"
//                   onClick={() => handleDescargarPDF(ticketSeleccionado)}
//                   style={{
//                     ...btnPrimaryStyle,
//                     backgroundColor: '#198754'
//                   }}
//                 >
//                   📄 Descargar PDF
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: guardando ? 0.7 : 1,
//                     cursor: guardando ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios!!'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         <>
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: loading ? 0.7 : 1,
//                     cursor: loading ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {loading ? 'Buscando...' : '🔍 Consultar'}
//                 </button>
//               </div>
//             </form>
//           </div>

//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.03em' }}>
//                       #{ticket.codigo_ticket || ticket.id}
//                     </div>

//                     <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f4f4f5', lineHeight: '1.4' }}>
//                       {ticket.titulo || ticket.asunto}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   transition: 'background-color 0.2s',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';


// const API_BASE_URL = 'http://localhost:5000/api';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formInconveniente, setFormInconveniente] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     axios.get(`${API_BASE_URL}/tecnicos`)
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get(`${API_BASE_URL}/tickets`);

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || ticket.estado || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id ?? ticket.tecnico_id ?? '');
//     setFormInconveniente(ticket.descripcion_problema || ticket.inconveniente || ticket.titulo || '');
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Generar y Descargar PDF
//   // const handleDescargarPDF = async (ticket) => {
//   //   if (!ticket) return;
//   //   try {
//   //     const jsPDFModule = await import('jspdf');
//   //     await import('jspdf-autotable');
//   //     const jsPDF = jsPDFModule.default || jsPDFModule;

//   //     const doc = new jsPDF();
      
//   //     doc.setFontSize(16);
//   //     doc.text(`Ticket #${ticket.codigo_ticket || ticket.id}`, 14, 20);

//   //     doc.autoTable({
//   //       startY: 30,
//   //       head: [['Solicitante', 'Email', 'Área', 'Categoría']],
//   //       body: [
//   //         [
//   //           ticket.usuario_reporta || ticket.solicitante || '-',
//   //           ticket.email_contacto || ticket.email || '-',
//   //           ticket.area_nombre || ticket.area || '-',
//   //           ticket.categoria_nombre || ticket.categoria || '-'
//   //         ]
//   //       ]
//   //     });

//   //     doc.autoTable({
//   //       startY: doc.lastAutoTable.finalY + 10,
//   //       head: [['Asunto / Inconveniente']],
//   //       body: [
//   //         [ticket.titulo || ticket.asunto || '-'],
//   //         [formInconveniente || 'Sin detalle de inconveniente']
//   //       ]
//   //     });

//   //     if (formSolucion) {
//   //       doc.autoTable({
//   //         startY: doc.lastAutoTable.finalY + 10,
//   //         head: [['Solución / Observaciones Técnicas']],
//   //         body: [[formSolucion]]
//   //       });
//   //     }

//   //     doc.save(`Ticket_${ticket.codigo_ticket || ticket.id}.pdf`);
//   //   } catch (err) {
//   //     console.error('Error generando PDF:', err);
//   //     alert('Error al generar el PDF. Revisa la consola.');
//   //   }
//   // };

//   // Generar y Descargar PDF
// const handleDescargarPDF = (ticket) => {
//   if (!ticket) return;

//   try {
//     const doc = new jsPDF();

//     // Encabezado
//     doc.setFontSize(16);
//     doc.setTextColor(0, 150, 136); // Verde / Esmeralda
//     doc.text(`Ticket #${ticket.codigo_ticket || ticket.id}`, 14, 20);

//     // Tabla 1: Datos del Solicitante
//     autoTable(doc, {
//       startY: 28,
//       head: [['Solicitante', 'Email', 'Área', 'Categoría']],
//       body: [
//         [
//           ticket.usuario_reporta || ticket.solicitante || '-',
//           ticket.email_contacto || ticket.email || '-',
//           ticket.area_nombre || ticket.area || 'N/A',
//           ticket.categoria_nombre || ticket.categoria || 'N/A'
//         ]
//       ],
//       theme: 'grid',
//       headStyles: { fillColor: [39, 39, 42] }
//     });

//     // Tabla 2: Estado, Prioridad y Asunto
//     autoTable(doc, {
//       startY: doc.lastAutoTable.finalY + 8,
//       head: [['Estado', 'Prioridad', 'Asunto']],
//       body: [
//         [
//           formEstado || ticket.estado_actual || 'N/A',
//           formPrioridad || ticket.prioridad || 'N/A',
//           ticket.titulo || ticket.asunto || '-'
//         ]
//       ],
//       theme: 'grid',
//       headStyles: { fillColor: [39, 39, 42] }
//     });

//     // Tabla 3: Detalle del Inconveniente
//     autoTable(doc, {
//       startY: doc.lastAutoTable.finalY + 8,
//       head: [['Inconveniente Reportado']],
//       body: [[formInconveniente || 'Sin detalle de inconveniente']],
//       theme: 'grid',
//       headStyles: { fillColor: [39, 39, 42] }
//     });

//     // Tabla 4: Solución / Notas Técnicas (Si existen)
//     if (formSolucion) {
//       autoTable(doc, {
//         startY: doc.lastAutoTable.finalY + 8,
//         head: [['Solución / Observaciones Técnicas']],
//         body: [[formSolucion]],
//         theme: 'grid',
//         headStyles: { fillColor: [16, 185, 129] } // Verde para la solución
//       });
//     }

//     // Descargar el archivo PDF
//     doc.save(`Ticket_${ticket.codigo_ticket || ticket.id}.pdf`);
//   } catch (err) {
//     console.error('Error generando el PDF:', err);
//     alert('Ocurrió un error al generar el PDF. Verifica los datos.');
//   }
// };

//   // Guardar modificaciones
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketRespuesta = data.ticket || data;

//       const ticketActualizado = {
//         ...ticketSeleccionado,
//         ...ticketRespuesta,
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico !== '' ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       setTicketSeleccionado(ticketActualizado);
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
      
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* BARRA DE BOTONES SUPERIORES */}
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
//             <button
//               type="button"
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               Volver al Listado de Tickets
//             </button>

//             <button
//               type="button"
//               onClick={() => handleDescargarPDF(ticketSeleccionado)}
//               style={{
//                 ...btnSecondaryStyle,
//                 backgroundColor: '#198754',
//                 borderColor: '#198754',
//                 color: '#ffffff',
//                 fontWeight: 'bold'
//               }}
//             >
//               📄 Descargar PDF
//             </button>
//           </div>

//           {/* TARJETA 1: DATOS DEL SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket || ticketSeleccionado.id}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: formEstado === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {formEstado.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {formPrioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta || ticketSeleccionado.solicitante || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto || ticketSeleccionado.email || '-'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5' }}>
//                 {ticketSeleccionado.titulo || ticketSeleccionado.asunto || '-'}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* CAMPO INCONVENIENTE */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>INCONVENIENTE</label>
//                 <textarea
//                   rows="3"
//                   value={formInconveniente}
//                   onChange={(e) => setFormInconveniente(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                   placeholder="Detalle del inconveniente del usuario..."
//                 />
//               </div>

//               {/* CAMPO SOLUCIÓN / OBSERVACIONES TÉCNICAS */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
//                 <button
//                   type="button"
//                   onClick={() => handleDescargarPDF(ticketSeleccionado)}
//                   style={{
//                     ...btnPrimaryStyle,
//                     backgroundColor: '#198754'
//                   }}
//                 >
//                   📄 Descargar PDF
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: guardando ? 0.7 : 1,
//                     cursor: guardando ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         <>
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   style={{
//                     ...btnPrimaryStyle,
//                     opacity: loading ? 0.7 : 1,
//                     cursor: loading ? 'not-allowed' : 'pointer'
//                   }}
//                 >
//                   {loading ? 'Buscando...' : '🔍 Consultar'}
//                 </button>
//               </div>
//             </form>
//           </div>

//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.03em' }}>
//                       #{ticket.codigo_ticket || ticket.id}
//                     </div>

//                     <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f4f4f5', lineHeight: '1.4' }}>
//                       {ticket.titulo || ticket.asunto}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   transition: 'background-color 0.2s',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formInconveniente, setFormInconveniente] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     axios.get('http://localhost:5000/api/tecnicos')
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get('http://localhost:5000/api/tickets');

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id || '');
//     setFormInconveniente(ticket.descripcion_problema || ticket.titulo || '');
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Guardar modificaciones
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico ? parseInt(formTecnico, 10) : null,
//         descripcion_problema: formInconveniente,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`http://localhost:5000/api/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketActualizado = data.ticket || data;

//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
//       setTicketSeleccionado(ticketActualizado);
      
//       setFormInconveniente(ticketActualizado.descripcion_problema || formInconveniente);
//       setFormSolucion(ticketActualizado.nota_tecnica || formSolucion);
      
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           <div>
//             <button
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               ← Volver al Listado de Tickets
//             </button>
//           </div>

//           {/* TARJETA 1: DATOS DEL SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: ticketSeleccionado.estado_actual === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {ticketSeleccionado.estado_actual?.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {ticketSeleccionado.prioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area_id || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria_id || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5' }}>
//                 {ticketSeleccionado.titulo}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* CAMPO INCONVENIENTE */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>INCONVENIENTE</label>
//                 <textarea
//                   rows="3"
//                   value={formInconveniente}
//                   onChange={(e) => setFormInconveniente(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                   placeholder="Detalle del inconveniente del usuario..."
//                 />
//               </div>

//               {/* CAMPO SOLUCIÓN / OBSERVACIONES TÉCNICAS */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={{ ...labelStyle, textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={btnPrimaryStyle}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         <>
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar !!!
//                 </button>
//                 <button
//                   type="submit"
//                   style={btnPrimaryStyle}
//                 >
//                   🔍 Consultar
//                 </button>
//               </div>
//             </form>
//           </div>

//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.03em' }}>
//                       #{ticket.codigo_ticket}
//                     </div>

//                     <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f4f4f5', lineHeight: '1.4' }}>
//                       {ticket.titulo}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado en vista de detalle
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     // Cargar la lista de técnicos para los selectores
//     axios.get('http://localhost:5000/api/tecnicos')
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   // Lógica de Consulta y Filtrado
//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get('http://localhost:5000/api/tickets');

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Limpiar filtros
//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle al hacer clic en una card (CORREGIDO: captura nota_tecnica o solucion)
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id || '');
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Guardar modificaciones del ticket
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico ? parseInt(formTecnico, 10) : null,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`http://localhost:5000/api/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketActualizado = data.ticket || data;

//       // Actualizar estado local en la lista de búsqueda
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
//       setTicketSeleccionado(ticketActualizado);
//       // Aseguramos que el textarea refleje inmediatamente lo guardado
//       setFormSolucion(ticketActualizado.nota_tecnica || ticketActualizado.solucion || '');
      
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {/* VISTA 1: DETALLE DE TICKET (SI HAY UNO SELECCIONADO) */}
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* Botón Volver */}
//           <div>
//             <button
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               ← Volver al Listado de Tickets
//             </button>
//           </div>

//           {/* TARJETA 1: INFORMACIÓN GENERAL Y SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: ticketSeleccionado.estado_actual === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {ticketSeleccionado.estado_actual?.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {ticketSeleccionado.prioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area_id || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria_id || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto y Detalle:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5', marginBottom: '6px' }}>
//                 {ticketSeleccionado.titulo}
//               </div>
//               <div style={{ color: '#d4d4d8', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
//                 {ticketSeleccionado.descripcion_problema}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: FORMULARIO DE GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 {/* Estado con valores acordes a la DB */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Prioridad con valores acordes a la DB */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 {/* Técnico Asignado */}
//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* Solución / Observaciones */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={labelStyle}>Solución / Observaciones Técnicas</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               {/* Botón Guardar */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={btnPrimaryStyle}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         /* VISTA 2: LISTADO / BÚSQUEDA POR FILTROS */
//         <>
//           {/* CABECERA */}
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           {/* PANEL DE FILTROS */}
//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
                
//                 {/* Código */}
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Asunto / Usuario */}
//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Estado Filtro */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Técnico */}
//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Prioridad Filtro */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//               </div>

//               {/* BOTONES DE ACCIÓN */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   style={btnPrimaryStyle}
//                 >
//                   🔍 Consultar
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* RESULTADOS O MENSAJE INICIAL */}
//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               {/* GRID DE CARDS */}
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     {/* Código / Identificador */}
//                     <div style={{
//                       fontSize: '0.85rem',
//                       fontWeight: '700',
//                       color: '#38bdf8',
//                       letterSpacing: '0.03em'
//                     }}>
//                       #{ticket.codigo_ticket}
//                     </div>

//                     {/* Título */}
//                     <div style={{
//                       fontSize: '1rem',
//                       fontWeight: '600',
//                       color: '#f4f4f5',
//                       lineHeight: '1.4'
//                     }}>
//                       {ticket.titulo}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS EN OBJETO
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado en vista de detalle
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     // Cargar la lista de técnicos para los selectores
//     axios.get('http://localhost:5000/api/tecnicos')
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   // Lógica de Consulta y Filtrado
//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get('http://localhost:5000/api/tickets');

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Limpiar filtros
//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle al hacer clic en una card
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id || '');
//     setFormSolucion(ticket.nota_tecnica || ticket.solucion || '');
//   };

//   // Guardar modificaciones del ticket
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico ? parseInt(formTecnico, 10) : null,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`http://localhost:5000/api/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketActualizado = data.ticket || data;

//       // Actualizar estado local en la lista de búsqueda
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
//       setTicketSeleccionado(ticketActualizado);
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {/* VISTA 1: DETALLE DE TICKET (SI HAY UNO SELECCIONADO) */}
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* Botón Volver */}
//           <div>
//             <button
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               ← Volver al Listado de Tickets
//             </button>
//           </div>

//           {/* TARJETA 1: INFORMACIÓN GENERAL Y SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: ticketSeleccionado.estado_actual === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {ticketSeleccionado.estado_actual?.replace('_', ' ')}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {ticketSeleccionado.prioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {ticketSeleccionado.creado_en ? new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR') : 'N/A'}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || ticketSeleccionado.area_id || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || ticketSeleccionado.categoria_id || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto y Detalle:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5', marginBottom: '6px' }}>
//                 {ticketSeleccionado.titulo}
//               </div>
//               <div style={{ color: '#d4d4d8', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
//                 {ticketSeleccionado.descripcion_problema}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: FORMULARIO DE GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 {/* Estado con valores acordes a la DB */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Prioridad con valores acordes a la DB */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//                 {/* Técnico Asignado */}
//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* Solución / Observaciones */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={labelStyle}>Solución / Observaciones Técnicas</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               {/* Botón Guardar */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={btnPrimaryStyle}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         /* VISTA 2: LISTADO / BÚSQUEDA POR FILTROS */
//         <>
//           {/* CABECERA */}
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           {/* PANEL DE FILTROS */}
//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
                
//                 {/* Código */}
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Asunto / Usuario */}
//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Estado Filtro */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN_PROGRESO">EN PROGRESO</option>
//                     <option value="ESCALADO">ESCALADO</option>
//                     <option value="RESUELTO">RESUELTO</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Técnico */}
//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Prioridad Filtro */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                     <option value="CRITICA">CRÍTICA</option>
//                   </select>
//                 </div>

//               </div>

//               {/* BOTONES DE ACCIÓN */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   style={btnPrimaryStyle}
//                 >
//                   🔍 Consultar
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* RESULTADOS O MENSAJE INICIAL */}
//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               {/* GRID DE CARDS */}
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     {/* Código / Identificador */}
//                     <div style={{
//                       fontSize: '0.85rem',
//                       fontWeight: '700',
//                       color: '#38bdf8',
//                       letterSpacing: '0.03em'
//                     }}>
//                       #{ticket.codigo_ticket}
//                     </div>

//                     {/* Título */}
//                     <div style={{
//                       fontSize: '1rem',
//                       fontWeight: '600',
//                       color: '#f4f4f5',
//                       lineHeight: '1.4'
//                     }}>
//                       {ticket.titulo}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS EN OBJETO
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false);

//   // Estado para el ticket seleccionado en vista de detalle
//   const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

//   // Estados para los campos editables del ticket en detalle
//   const [formEstado, setFormEstado] = useState('');
//   const [formPrioridad, setFormPrioridad] = useState('');
//   const [formTecnico, setFormTecnico] = useState('');
//   const [formSolucion, setFormSolucion] = useState('');
//   const [guardando, setGuardando] = useState(false);

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     // Cargar la lista de técnicos para los selectores
//     axios.get('http://localhost:5000/api/tecnicos')
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   // Lógica de Consulta y Filtrado
//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get('http://localhost:5000/api/tickets');

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Limpiar filtros
//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   // Abrir vista de detalle al hacer clic en una card
//   const handleAbrirTicket = (ticket) => {
//     setTicketSeleccionado(ticket);
//     setFormEstado(ticket.estado_actual || 'ABIERTO');
//     setFormPrioridad(ticket.prioridad || 'MEDIA');
//     setFormTecnico(ticket.asignado_a_tecnico_id || '');
//     setFormSolucion(ticket.solucion || '');
//   };

//   // Guardar modificaciones del ticket
//   const handleGuardarCambios = async (e) => {
//     e.preventDefault();
//     if (!ticketSeleccionado) return;

//     setGuardando(true);
//     try {
//       const payload = {
//         estado_actual: formEstado,
//         prioridad: formPrioridad,
//         asignado_a_tecnico_id: formTecnico ? parseInt(formTecnico, 10) : null,
//         nota_tecnica: formSolucion
//       };

//       const { data } = await axios.put(`http://localhost:5000/api/tickets/${ticketSeleccionado.id}`, payload);
      
//       const ticketActualizado = data.ticket || data;

//       // Actualizar estado local en la lista de búsqueda
//       setTickets(prev => prev.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
//       setTicketSeleccionado(ticketActualizado);
//       alert('Ticket actualizado correctamente.');
//     } catch (error) {
//       console.error('Error al actualizar el ticket:', error);
//       alert('Ocurrió un error al intentar guardar los cambios.');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {/* VISTA 1: DETALLE DE TICKET (SI HAY UNO SELECCIONADO) */}
//       {ticketSeleccionado ? (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
//           {/* Botón Volver */}
//           <div>
//             <button
//               onClick={() => setTicketSeleccionado(null)}
//               style={btnSecondaryStyle}
//             >
//               ← Volver al Listado de Tickets
//             </button>
//           </div>

//           {/* TARJETA 1: INFORMACIÓN GENERAL Y SOLICITANTE */}
//           <div style={cardBoxStyle}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #27272a', paddingBottom: '16px', marginBottom: '16px' }}>
//               <div>
//                 <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981', marginRight: '12px' }}>
//                   #{ticketSeleccionado.codigo_ticket}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: ticketSeleccionado.estado_actual === 'CERRADO' ? '#065f46' : '#991b1b', color: '#fff' }}>
//                   {ticketSeleccionado.estado_actual}
//                 </span>
//                 <span style={{ ...badgeStyle, backgroundColor: '#374151', color: '#f3f4f6', marginLeft: '6px' }}>
//                   {ticketSeleccionado.prioridad}
//                 </span>
//               </div>
//               <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
//                 Creado: {new Date(ticketSeleccionado.creado_en).toLocaleString('es-AR')}
//               </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Solicitante: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.usuario_reporta}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Email: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.email_contacto}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Área: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.area_nombre || 'N/A'}</strong>
//               </div>
//               <div>
//                 <span style={{ color: '#9ca3af' }}>Categoría: </span>
//                 <strong style={{ color: '#f4f4f5' }}>{ticketSeleccionado.categoria_nombre || 'N/A'}</strong>
//               </div>
//             </div>

//             <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
//               <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
//                 Asunto y Detalle:
//               </div>
//               <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f4f4f5', marginBottom: '6px' }}>
//                 {ticketSeleccionado.titulo}
//               </div>
//               <div style={{ color: '#d4d4d8', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
//                 {ticketSeleccionado.descripcion_problema}
//               </div>
//             </div>
//           </div>

//           {/* TARJETA 2: FORMULARIO DE GESTIÓN DE TICKET */}
//           <div style={cardBoxStyle}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f3f4f6', borderBottom: '1px solid #27272a', paddingBottom: '10px' }}>
//               Gestionar Ticket
//             </h3>

//             <form onSubmit={handleGuardarCambios}>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
//                 {/* Estado */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={formEstado}
//                     onChange={(e) => setFormEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN PROCESO">EN PROCESO</option>
//                     <option value="PENDIENTE">PENDIENTE</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Prioridad */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={formPrioridad}
//                     onChange={(e) => setFormPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                   </select>
//                 </div>

//                 {/* Técnico Asignado */}
//                 <div>
//                   <label style={labelStyle}>Técnico Asignado</label>
//                   <select
//                     value={formTecnico}
//                     onChange={(e) => setFormTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Sin Asignar --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//               </div>

//               {/* Solución / Nota técnica */}
//               <div style={{ marginBottom: '20px' }}>
//                 <label style={labelStyle}>Solución / Observaciones Técnicas</label>
//                 <textarea
//                   rows="4"
//                   placeholder="Describa la solución aplicada o notas de seguimiento..."
//                   value={formSolucion}
//                   onChange={(e) => setFormSolucion(e.target.value)}
//                   style={{ ...inputStyle, resize: 'vertical' }}
//                 />
//               </div>

//               {/* Botón Guardar */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//                 <button
//                   type="submit"
//                   disabled={guardando}
//                   style={btnPrimaryStyle}
//                 >
//                   {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
//                 </button>
//               </div>
//             </form>
//           </div>

//         </div>
//       ) : (
//         /* VISTA 2: LISTADO / BÚSQUEDA POR FILTROS */
//         <>
//           {/* CABECERA */}
//           <div style={{ marginBottom: '24px' }}>
//             <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//               Gestión Global de Tickets
//             </h2>
//             <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//               Aplique los filtros necesarios para consultar las solicitudes registradas.
//             </p>
//           </div>

//           {/* PANEL DE FILTROS */}
//           <div style={{
//             backgroundColor: '#18181b',
//             border: '1px solid #27272a',
//             borderRadius: '12px',
//             padding: '20px',
//             marginBottom: '28px',
//             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//           }}>
//             <form onSubmit={handleBuscar}>
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                 gap: '16px',
//                 marginBottom: '16px'
//               }}>
                
//                 {/* Código */}
//                 <div>
//                   <label style={labelStyle}>Código Ticket</label>
//                   <input
//                     type="text"
//                     placeholder="Ej: TCK-790878"
//                     value={filtroCodigo}
//                     onChange={(e) => setFiltroCodigo(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Asunto / Usuario */}
//                 <div>
//                   <label style={labelStyle}>Usuario / Título</label>
//                   <input
//                     type="text"
//                     placeholder="Buscar por texto..."
//                     value={filtroUsuario}
//                     onChange={(e) => setFiltroUsuario(e.target.value)}
//                     style={inputStyle}
//                   />
//                 </div>

//                 {/* Estado */}
//                 <div>
//                   <label style={labelStyle}>Estado</label>
//                   <select
//                     value={filtroEstado}
//                     onChange={(e) => setFiltroEstado(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     <option value="ABIERTO">ABIERTO</option>
//                     <option value="EN PROCESO">EN PROCESO</option>
//                     <option value="PENDIENTE">PENDIENTE</option>
//                     <option value="CERRADO">CERRADO</option>
//                   </select>
//                 </div>

//                 {/* Técnico */}
//                 <div>
//                   <label style={labelStyle}>Técnico</label>
//                   <select
//                     value={filtroTecnico}
//                     onChange={(e) => setFiltroTecnico(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todos --</option>
//                     {tecnicos.map(tec => (
//                       <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Prioridad */}
//                 <div>
//                   <label style={labelStyle}>Prioridad</label>
//                   <select
//                     value={filtroPrioridad}
//                     onChange={(e) => setFiltroPrioridad(e.target.value)}
//                     style={inputStyle}
//                   >
//                     <option value="">-- Todas --</option>
//                     <option value="BAJA">BAJA</option>
//                     <option value="MEDIA">MEDIA</option>
//                     <option value="ALTA">ALTA</option>
//                   </select>
//                 </div>

//               </div>

//               {/* BOTONES DE ACCIÓN */}
//               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//                 <button
//                   type="button"
//                   onClick={handleLimpiar}
//                   style={btnSecondaryStyle}
//                 >
//                   Limpiar
//                 </button>
//                 <button
//                   type="submit"
//                   style={btnPrimaryStyle}
//                 >
//                   🔍 Consultar
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* RESULTADOS O MENSAJE INICIAL */}
//           {!haBuscado ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//               <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//                 Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar los tickets.
//               </p>
//             </div>
//           ) : loading ? (
//             <div style={placeholderBoxStyle}>
//               <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div style={placeholderBoxStyle}>
//               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//               <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//               <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//                 No se encontraron tickets con los parámetros indicados.
//               </p>
//             </div>
//           ) : (
//             <div>
//               <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//                 Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong> (Haga clic en una tarjeta para gestionar)
//               </div>

//               {/* GRID DE CARDS */}
//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//                 gap: '16px'
//               }}>
//                 {tickets.map((ticket) => (
//                   <div
//                     key={ticket.id}
//                     onClick={() => handleAbrirTicket(ticket)}
//                     style={{
//                       backgroundColor: '#18181b',
//                       border: '1px solid #27272a',
//                       borderRadius: '10px',
//                       padding: '18px 20px',
//                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       gap: '8px',
//                       transition: 'all 0.15s ease-in-out',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.borderColor = '#38bdf8';
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.borderColor = '#27272a';
//                       e.currentTarget.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     {/* Código / Identificador */}
//                     <div style={{
//                       fontSize: '0.85rem',
//                       fontWeight: '700',
//                       color: '#38bdf8',
//                       letterSpacing: '0.03em'
//                     }}>
//                       #{ticket.codigo_ticket}
//                     </div>

//                     {/* Título */}
//                     <div style={{
//                       fontSize: '1rem',
//                       fontWeight: '600',
//                       color: '#f4f4f5',
//                       lineHeight: '1.4'
//                     }}>
//                       {ticket.titulo}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// };

// // ESTILOS EN OBJETO
// const cardBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '1px solid #27272a',
//   borderRadius: '12px',
//   padding: '20px',
//   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
// };

// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '10px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const badgeStyle = {
//   padding: '3px 8px',
//   borderRadius: '6px',
//   fontSize: '0.75rem',
//   fontWeight: '700'
// };

// const btnPrimaryStyle = {
//   padding: '10px 20px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;



// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const HistorialGlobal = () => {
//   const [tickets, setTickets] = useState([]);
//   const [tecnicos, setTecnicos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [haBuscado, setHaBuscado] = useState(false); // No muestra tickets hasta consultar

//   // Estados de los Filtros
//   const [filtroCodigo, setFiltroCodigo] = useState('');
//   const [filtroUsuario, setFiltroUsuario] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState('');
//   const [filtroTecnico, setFiltroTecnico] = useState('');
//   const [filtroPrioridad, setFiltroPrioridad] = useState('');

//   useEffect(() => {
//     // Cargar la lista de técnicos para el selector
//     axios.get('http://localhost:5000/api/tecnicos')
//       .then(res => setTecnicos(res.data))
//       .catch(err => console.error('Error al cargar técnicos:', err));
//   }, []);

//   // Lógica de Consulta y Filtrado
//   const handleBuscar = async (e) => {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setHaBuscado(true);

//     try {
//       const { data } = await axios.get('http://localhost:5000/api/tickets');

//       const resultados = data.filter(ticket => {
//         const matchCodigo = !filtroCodigo || ticket.codigo_ticket?.toLowerCase().includes(filtroCodigo.toLowerCase());
//         const matchUsuario = !filtroUsuario || 
//           ticket.usuario_reporta?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
//           ticket.titulo?.toLowerCase().includes(filtroUsuario.toLowerCase());
//         const matchEstado = !filtroEstado || ticket.estado_actual === filtroEstado;
//         const matchTecnico = !filtroTecnico || String(ticket.asignado_a_tecnico_id) === String(filtroTecnico);
//         const matchPrioridad = !filtroPrioridad || ticket.prioridad === filtroPrioridad;

//         return matchCodigo && matchUsuario && matchEstado && matchTecnico && matchPrioridad;
//       });

//       setTickets(resultados);
//     } catch (error) {
//       console.error('Error al realizar la consulta:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Limpiar filtros y ocultar tarjetas
//   const handleLimpiar = () => {
//     setFiltroCodigo('');
//     setFiltroUsuario('');
//     setFiltroEstado('');
//     setFiltroTecnico('');
//     setFiltroPrioridad('');
//     setTickets([]);
//     setHaBuscado(false);
//   };

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
//       {/* CABECERA */}
//       <div style={{ marginBottom: '24px' }}>
//         <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f3f4f6', margin: '0 0 6px 0' }}>
//           Gestión Global de Tickets
//         </h2>
//         <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
//           Aplique los filtros necesarios para consultar las solicitudes registradas.
//         </p>
//       </div>

//       {/* PANEL DE FILTROS */}
//       <div style={{
//         backgroundColor: '#18181b',
//         border: '1px solid #27272a',
//         borderRadius: '12px',
//         padding: '20px',
//         marginBottom: '28px',
//         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
//       }}>
//         <form onSubmit={handleBuscar}>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//             gap: '16px',
//             marginBottom: '16px'
//           }}>
            
//             {/* Código */}
//             <div>
//               <label style={labelStyle}>Código Ticket</label>
//               <input
//                 type="text"
//                 placeholder="Ej: TCK-790878"
//                 value={filtroCodigo}
//                 onChange={(e) => setFiltroCodigo(e.target.value)}
//                 style={inputStyle}
//               />
//             </div>

//             {/* Asunto / Usuario */}
//             <div>
//               <label style={labelStyle}>Usuario / Título</label>
//               <input
//                 type="text"
//                 placeholder="Buscar por texto..."
//                 value={filtroUsuario}
//                 onChange={(e) => setFiltroUsuario(e.target.value)}
//                 style={inputStyle}
//               />
//             </div>

//             {/* Estado */}
//             <div>
//               <label style={labelStyle}>Estado</label>
//               <select
//                 value={filtroEstado}
//                 onChange={(e) => setFiltroEstado(e.target.value)}
//                 style={inputStyle}
//               >
//                 <option value="">-- Todos --</option>
//                 <option value="ABIERTO">ABIERTO</option>
//                 <option value="EN PROCESO">EN PROCESO</option>
//                 <option value="PENDIENTE">PENDIENTE</option>
//                 <option value="CERRADO">CERRADO</option>
//               </select>
//             </div>

//             {/* Técnico */}
//             <div>
//               <label style={labelStyle}>Técnico</label>
//               <select
//                 value={filtroTecnico}
//                 onChange={(e) => setFiltroTecnico(e.target.value)}
//                 style={inputStyle}
//               >
//                 <option value="">-- Todos --</option>
//                 {tecnicos.map(tec => (
//                   <option key={tec.id} value={tec.id}>{tec.nombre}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Prioridad */}
//             <div>
//               <label style={labelStyle}>Prioridad</label>
//               <select
//                 value={filtroPrioridad}
//                 onChange={(e) => setFiltroPrioridad(e.target.value)}
//                 style={inputStyle}
//               >
//                 <option value="">-- Todas --</option>
//                 <option value="BAJA">BAJA</option>
//                 <option value="MEDIA">MEDIA</option>
//                 <option value="ALTA">ALTA</option>
//               </select>
//             </div>

//           </div>

//           {/* BOTONES DE ACCIÓN */}
//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
//             <button
//               type="button"
//               onClick={handleLimpiar}
//               style={btnSecondaryStyle}
//             >
//               Limpiar
//             </button>
//             <button
//               type="submit"
//               style={btnPrimaryStyle}
//             >
//               🔍 Consultar
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* CONTENIDO PRINCIPAL / TARJETAS */}
//       {!haBuscado ? (
//         <div style={placeholderBoxStyle}>
//           <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔎</div>
//           <h3 style={{ margin: '0 0 6px 0', color: '#e4e4e7', fontSize: '1.1rem' }}>No se han aplicado filtros</h3>
//           <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem' }}>
//             Seleccione los criterios arriba y presione <strong>Consultar</strong> para desplegar las tarjetas de tickets.
//           </p>
//         </div>
//       ) : loading ? (
//         <div style={placeholderBoxStyle}>
//           <p style={{ color: '#a1a1aa', margin: 0 }}>Consultando datos...</p>
//         </div>
//       ) : tickets.length === 0 ? (
//         <div style={placeholderBoxStyle}>
//           <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
//           <h3 style={{ margin: '0 0 4px 0', color: '#e4e4e7', fontSize: '1rem' }}>Sin resultados</h3>
//           <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
//             No se encontraron tickets con los parámetros indicados.
//           </p>
//         </div>
//       ) : (
//         <div>
//           {/* CONTEO DE RESULTADOS */}
//           <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '0.9rem' }}>
//             Resultados encontrados: <strong style={{ color: '#38bdf8' }}>{tickets.length}</strong>
//           </div>

//           {/* GRID DE CARDS (Sólo Código y Título) */}
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
//             gap: '16px'
//           }}>
//             {tickets.map((ticket) => (
//               <div
//                 key={ticket.id}
//                 style={{
//                   backgroundColor: '#18181b',
//                   border: '1px solid #27272a',
//                   borderRadius: '10px',
//                   padding: '18px 20px',
//                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   gap: '8px',
//                   transition: 'border-color 0.2s',
//                   cursor: 'pointer'
//                 }}
//                 onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
//                 onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
//               >
//                 {/* Código / Identificador */}
//                 <div style={{
//                   fontSize: '0.85rem',
//                   fontWeight: '700',
//                   color: '#38bdf8',
//                   letterSpacing: '0.03em'
//                 }}>
//                   #{ticket.codigo_ticket}
//                 </div>

//                 {/* Título */}
//                 <div style={{
//                   fontSize: '1rem',
//                   fontWeight: '600',
//                   color: '#f4f4f5',
//                   lineHeight: '1.4'
//                 }}>
//                   {ticket.titulo}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// // ESTILOS EN OBJETO
// const labelStyle = {
//   display: 'block',
//   color: '#a1a1aa',
//   fontSize: '0.78rem',
//   fontWeight: '600',
//   marginBottom: '6px',
//   textTransform: 'uppercase',
//   letterSpacing: '0.025em'
// };

// const inputStyle = {
//   width: '100%',
//   padding: '9px 12px',
//   backgroundColor: '#09090b',
//   border: '1px solid #27272a',
//   borderRadius: '6px',
//   color: '#f4f4f5',
//   fontSize: '0.875rem',
//   outline: 'none',
//   boxSizing: 'border-box'
// };

// const btnPrimaryStyle = {
//   padding: '9px 18px',
//   backgroundColor: '#2563eb',
//   color: '#ffffff',
//   border: 'none',
//   borderRadius: '6px',
//   fontWeight: '600',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const btnSecondaryStyle = {
//   padding: '9px 16px',
//   backgroundColor: '#27272a',
//   color: '#e4e4e7',
//   border: '1px solid #3f3f46',
//   borderRadius: '6px',
//   fontWeight: '500',
//   fontSize: '0.875rem',
//   cursor: 'pointer'
// };

// const placeholderBoxStyle = {
//   backgroundColor: '#18181b',
//   border: '2px dashed #27272a',
//   borderRadius: '12px',
//   padding: '48px 20px',
//   textAlign: 'center',
//   color: '#a1a1aa'
// };

// export default HistorialGlobal;

// import { useEffect, useState } from 'react';
// import API from '../services/api';

// export default function TicketsGlobales() {
//   const [tickets, setTickets] = useState([]);
//   const [cargando, setCargando] = useState(true);

//   // Cargar todos los tickets al montar el componente
//   const cargarTickets = async () => {
//     try {
//       const res = await API.get('/tickets'); // Ajusta a tu endpoint real que retorne Ticket.getAll()
//       setTickets(res.data);
//     } catch (error) {
//       console.error('Error al cargar tickets:', error);
//     } finally {
//       setCargando(false);
//     }
//   };

//   useEffect(() => {
//     cargarTickets();
//   }, []);

//   // Manejar el cambio de estado directo desde la tabla
//   const handleEstadoChange = async (ticketId, nuevoEstado) => {
//     try {
//       // Ajusta la URL del endpoint según tus rutas (ej: PUT /api/tickets/:id/estado)
//       await API.put(`/tickets/${ticketId}`, { estado_actual: nuevoEstado });

//       // Actualizar el estado localmente para reflejar el cambio inmediato en pantalla
//       setTickets((prev) =>
//         prev.map((t) => (t.id === ticketId ? { ...t, estado_actual: nuevoEstado } : t))
//       );
//     } catch (error) {
//       console.error('Error al cambiar el estado:', error);
//       alert('No se pudo actualizar el estado del ticket.');
//     }
//   };

//   if (cargando) return <p style={{ textAlign: 'center', color: '#fff' }}>Cargando tickets...</p>;

//   return (
//     <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
//       <h2 style={{ textAlign: 'center' }}>Gestión Global de Tickets</h2>
//       <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '1.5rem' }}>
//         Listado de todos los tickets registrados en el sistema.
//       </p>

//       <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
//         <thead>
//           <tr style={{ backgroundColor: '#f8f9fa', color: '#333', borderBottom: '2px solid #dee2e6' }}>
//             <th style={{ padding: '10px' }}>Fecha</th>
//             <th style={{ padding: '10px' }}>Código</th>
//             <th style={{ padding: '10px' }}>Detalle / Descripción</th>
//             <th style={{ padding: '10px' }}>Usuario</th>
//             <th style={{ padding: '10px' }}>Técnico</th>
//             <th style={{ padding: '10px' }}>Prioridad</th>
//             <th style={{ padding: '10px' }}>Estado</th>
//           </tr>
//         </thead>
//         <tbody>
//           {tickets.map((t) => (
//             <tr key={t.id} style={{ borderBottom: '1px solid #444' }}>
//               <td style={{ padding: '10px', fontSize: '0.85rem' }}>
//                 {new Date(t.creado_en).toLocaleDateString()}
//               </td>
//               <td style={{ padding: '10px', fontWeight: 'bold' }}>
//                 #{t.codigo_ticket}
//               </td>
//               <td style={{ padding: '10px' }}>
//                 <div style={{ fontWeight: 'bold' }}>{t.titulo}</div>
//                 <div style={{ fontSize: '0.85rem', color: '#ccc' }}>{t.descripcion_problema}</div>
//               </td>
//               <td style={{ padding: '10px', fontSize: '0.85rem' }}>
//                 <div>{t.usuario_reporta}</div>
//                 <small style={{ color: '#aaa' }}>{t.email_contacto}</small>
//               </td>
//               <td style={{ padding: '10px' }}>
//                 {t.tecnico_nombre || 'Sin asignar'}
//               </td>
//               <td style={{ padding: '10px', fontSize: '0.85rem' }}>
//                 {t.prioridad}
//               </td>
//               <td style={{ padding: '10px' }}>
//                 <select
//                   value={t.estado_actual}
//                   onChange={(e) => handleEstadoChange(t.id, e.target.value)}
//                   style={{
//                     padding: '6px 10px',
//                     borderRadius: '4px',
//                     fontWeight: 'bold',
//                     backgroundColor:
//                       t.estado_actual === 'ABIERTO'
//                         ? '#e74c3c'
//                         : t.estado_actual === 'EN_PROGRESO'
//                         ? '#f39c12'
//                         : '#2ecc71',
//                     color: '#fff',
//                     border: 'none',
//                     cursor: 'pointer'
//                   }}
//                 >
//                   <option value="ABIERTO" style={{ backgroundColor: '#fff', color: '#333' }}>
//                     ABIERTO
//                   </option>
//                   <option value="EN_PROGRESO" style={{ backgroundColor: '#fff', color: '#333' }}>
//                     EN_PROGRESO
//                   </option>
//                   <option value="CERRADO" style={{ backgroundColor: '#fff', color: '#333' }}>
//                     CERRADO
//                   </option>
//                 </select>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }


// import { useState, useEffect } from 'react';
// import API from '../services/api';

// export default function HistorialGlobal() {
//   const [historial, setHistorial] = useState([]);
//   const [cargando, setCargando] = useState(true);

//   useEffect(() => {
//     const obtenerHistorialGlobal = async () => {
//       try {
//         const response = await API.get('/historial');
//         setHistorial(response.data);
//       } catch (error) {
//         console.error('Error al obtener el historial global:', error);
//       } finally {
//         setCargando(false);
//       }
//     };

//     obtenerHistorialGlobal();
//   }, []);

//   if (cargando) return <p style={{ textAlign: 'center' }}>Cargando historial global...</p>;

//   return (
//     <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
//       <h2>Historial Global de Movimientos</h2>
//       <p style={{ color: '#6c757d' }}>Registro auditable de todas las notas y cambios de estado del sistema.</p>

//       {historial.length === 0 ? (
//         <p>No se registran eventos en el sistema aún.</p>
//       ) : (
//         <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#f2f2f2', textAlignment: 'left' }}>
//               <th style={{ padding: '8px', border: '1px solid #ddd' }}>Fecha / Hora</th>
//               <th style={{ padding: '8px', border: '1px solid #ddd' }}>Ticket</th>
//               <th style={{ padding: '8px', border: '1px solid #ddd' }}>Técnico</th>
//               <th style={{ padding: '8px', border: '1px solid #ddd' }}>Cambio Estado</th>
//               <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nota Técnica</th>
//             </tr>
//           </thead>
//           <tbody>
//             {historial.map((row) => (
//               <tr key={row.id}>
//                 <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }}>
//                   {new Date(row.creado_en).toLocaleString()}
//                 </td>
//                 <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
//                   #{row.codigo_ticket || row.ticket_id}
//                 </td>
//                 <td style={{ padding: '8px', border: '1px solid #ddd' }}>
//                   {row.tecnico_nombre || 'Sistema'}
//                 </td>
//                 <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }}>
//                   {row.estado_anterior && row.estado_nuevo ? (
//                     `${row.estado_anterior} ➔ ${row.estado_nuevo}`
//                   ) : (
//                     <span style={{ color: '#888' }}>Sin cambio</span>
//                   )}
//                 </td>
//                 <td style={{ padding: '8px', border: '1px solid #ddd' }}>
//                   {row.nota_tecnica || '-'}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
