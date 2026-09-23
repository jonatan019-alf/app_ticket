import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function DetalleTicket() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  // ESTADO DE REFERENCIA INICIAL PARA COMPARAR CAMBIOS
  const [valoresIniciales, setValoresIniciales] = useState({
    estado: '',
    tecnicoId: ''
  });

  // ESTADOS DEL FORMULARIO
  const [tecnicoId, setTecnicoId] = useState('');
  const [estadoAnterior, setEstadoAnterior] = useState('');
  const [estadoNuevo, setEstadoNuevo] = useState('');
  const [notaTecnica, setNotaTecnica] = useState('');

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(true);

  const estadosPosibles = ['ABIERTO', 'EN_PROGRESO', 'ESCALADO', 'RESUELTO', 'CERRADO'];

  const cargarDatos = async () => {
    try {
      const [resTicket, resHistorial, resTecnicos] = await Promise.all([
        API.get(`/tickets/${ticketId}`),
        API.get(`/tickets/${ticketId}/historial`),
        API.get('/tecnicos')
      ]);

      const ticketData = resTicket.data;
      setTicket(ticketData);
      setHistorial(resHistorial.data);
      setTecnicos(resTecnicos.data.filter((t) => t.activo));

      // Normalización estricta de valores
      const estadoNorm = String(ticketData.estado_actual || ticketData.estado || '').trim();
      const rawTecnico = ticketData.tecnico_id ?? ticketData.asignado_a_tecnico_id ?? '';
      const tecnicoNorm = rawTecnico !== null && rawTecnico !== undefined ? String(rawTecnico).trim() : '';

      // Guardar copia exacta de referencia inicial
      setValoresIniciales({
        estado: estadoNorm,
        tecnicoId: tecnicoNorm
      });

      // Asignar estado actual del formulario
      setEstadoAnterior(estadoNorm);
      setEstadoNuevo(estadoNorm);
      setTecnicoId(tecnicoNorm);
      setNotaTecnica('');

    } catch (error) {
      console.error('Error al obtener datos del ticket:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el ticket o su historial.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [ticketId]);

  // CONTROL DE HABILITACIÓN DEL BOTÓN
  const cambioEstado = String(estadoNuevo).trim() !== valoresIniciales.estado;
  const cambioTecnico = String(tecnicoId).trim() !== valoresIniciales.tecnicoId;
  const hayNota = notaTecnica.trim().length > 0;

  const hayCambios = cambioEstado || cambioTecnico || hayNota;

  const descargarPDF = async () => {
    if (!ticket) return;
    try {
      const jsPDFModule = await import('jspdf');
      await import('jspdf-autotable');
      const jsPDF = jsPDFModule.default || jsPDFModule;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Ticket #${ticket.codigo_ticket || ticket.id || ticketId}`, 14, 20);

      doc.autoTable({
        startY: 30,
        head: [['Solicitante', 'Email', 'Área', 'Categoría']],
        body: [
          [
            ticket.usuario_reporta || ticket.solicitante || '-',
            ticket.email_contacto || ticket.email || '-',
            ticket.area_nombre || ticket.area || '-',
            ticket.categoria_nombre || ticket.categoria || '-'
          ]
        ]
      });

      doc.save(`Ticket_${ticket.codigo_ticket || ticket.id || ticketId}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF. Revisa la consola.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hayCambios) return;

    setMensaje({ tipo: '', texto: '' });

    try {
      const payload = {
        tecnico_id: tecnicoId ? parseInt(tecnicoId, 10) : null,
        estado_anterior: estadoAnterior || null,
        estado_nuevo: estadoNuevo || null,
        nota_tecnica: notaTecnica
      };

      await API.post(`/tickets/${ticketId}/historial`, payload);

      if (estadoNuevo !== valoresIniciales.estado) {
        await API.put(`/tickets/${ticketId}`, { estado_actual: estadoNuevo });
      }

      setMensaje({ tipo: 'exito', texto: 'Cambios guardados correctamente.' });
      await cargarDatos();
    } catch (error) {
      console.error('Error al registrar historial:', error);
      const errorMsg = error.response?.data?.error || 'Error al guardar los cambios';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  if (cargando) return <p style={{ color: '#fff', textAlign: 'center' }}>Cargando detalles del ticket...</p>;
  if (!ticket) return <p style={{ color: '#fff', textAlign: 'center' }}>El ticket solicitado no existe.</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      
      {/* BOTONES SUPERIORES */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('/historial')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Volver al Listado de Tickets
        </button>

        <button
          type="button"
          onClick={descargarPDF}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#198754',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📄 Descargar PDF
        </button>
      </div>

      {/* DETALLE DEL TICKET */}
      <div style={{ background: '#121212', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, color: '#00e676' }}>#{ticket.codigo_ticket || ticket.id}</h2>
            <span style={{ background: '#dc3545', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {ticket.estado_actual || ticket.estado || 'ABIERTO'}
            </span>
            <span style={{ background: '#6c757d', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {ticket.prioridad || 'NORMAL'}
            </span>
          </div>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            Creado: {ticket.creado_en ? new Date(ticket.creado_en).toLocaleString() : '-'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', color: '#ccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <div>Solicitante: <strong style={{ color: '#fff' }}>{ticket.usuario_reporta || ticket.solicitante || '-'}</strong></div>
          <div>Email: <strong style={{ color: '#fff' }}>{ticket.email_contacto || ticket.email || '-'}</strong></div>
          <div>Área: <strong style={{ color: '#fff' }}>{ticket.area_nombre || ticket.area || '-'}</strong></div>
          <div>Categoría: <strong style={{ color: '#fff' }}>{ticket.categoria_nombre || ticket.categoria || '-'}</strong></div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '1px' }}>ASUNTO:</div>
          <h3 style={{ margin: '0.25rem 0 0 0', color: '#fff' }}>{ticket.titulo || ticket.asunto || '-'}</h3>
        </div>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <div style={{ background: '#121212', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
        <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '1.5rem' }}>Gestionar Ticket</h3>

        {mensaje.texto && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: mensaje.tipo === 'exito' ? '#198754' : '#dc3545',
            color: '#fff',
            textAlign: 'center'
          }}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', textAlign: 'center' }}>ESTADO</label>
              <select
                value={estadoNuevo}
                onChange={(e) => setEstadoNuevo(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              >
                {estadosPosibles.map((est) => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', textAlign: 'center' }}>PRIORIDAD</label>
              <select
                value={ticket.prioridad || 'NORMAL'}
                disabled
                style={{ width: '100%', padding: '0.6rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              >
                <option value={ticket.prioridad || 'NORMAL'}>{ticket.prioridad || 'NORMAL'}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', textAlign: 'center' }}>TÉCNICO ASIGNADO</label>
              <select
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              >
                <option value="">-- Sin asignar --</option>
                {tecnicos.map((tec) => (
                  <option key={tec.id} value={String(tec.id)}>{tec.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', textAlign: 'center' }}>INCONVENIENTE</label>
            <textarea
              rows="3"
              value={ticket.descripcion_problema || ticket.inconveniente || ''}
              readOnly
              style={{ width: '100%', padding: '0.6rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', textAlign: 'center' }}>SOLUCIÓN / OBSERVACIONES TÉCNICAS</label>
            <textarea
              rows="3"
              value={notaTecnica}
              onChange={(e) => setNotaTecnica(e.target.value)}
              placeholder="Escribe el diagnóstico o solución..."
              style={{ width: '100%', padding: '0.6rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={descargarPDF}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#198754',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📄 Descargar PDF
            </button>

            <button
              type="submit"
              disabled={!hayCambios}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: hayCambios ? '#0d6efd' : '#333333',
                color: hayCambios ? '#ffffff' : '#777777',
                border: 'none',
                borderRadius: '4px',
                cursor: hayCambios ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: hayCambios ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
            >
              💾 Guardar Cambios!!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
