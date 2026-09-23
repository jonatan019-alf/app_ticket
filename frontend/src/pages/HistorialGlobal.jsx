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



