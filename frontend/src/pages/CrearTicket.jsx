import { useState, useEffect } from 'react';
import API from '../services/api';

export default function CrearTicket() {
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [formData, setFormData] = useState({
    usuario_reporta: '',
    email_contacto: '',
    area_id: '',
    categoria_id: '',
    titulo: '',
    prioridad: 'MEDIA',
    descripcion_problema: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  // Cargar áreas y categorías desde la base de datos
  useEffect(() => {
    const cargarCombos = async () => {
      try {
        const [resAreas, resCategorias] = await Promise.all([
          API.get('/areas'),
          API.get('/categorias')
        ]);
        setAreas(resAreas.data);
        setCategorias(resCategorias.data);
      } catch (error) {
        console.error('Error al cargar datos del formulario:', error);
      }
    };
    cargarCombos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el campo que cambia es 'area_id', buscamos el correo correspondiente al área elegida
    if (name === 'area_id') {
      const areaSeleccionada = areas.find((a) => a.id === parseInt(value, 10));
      
      setFormData((prev) => ({
        ...prev,
        area_id: value,
        email_contacto: areaSeleccionada ? (areaSeleccionada.correo || '') : ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setCargando(true);

    // 1. Obtener los datos del técnico en sesión desde localStorage
    const tecnicoGuardado = localStorage.getItem('tecnico');
    const tecnico = tecnicoGuardado ? JSON.parse(tecnicoGuardado) : null;

    const codigoGenerado = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Incluir "asignado_a_tecnico_id" en el payload
    const payload = {
      codigo_ticket: codigoGenerado,
      area_id: parseInt(formData.area_id, 10),
      categoria_id: parseInt(formData.categoria_id, 10),
      asignado_a_tecnico_id: tecnico ? parseInt(tecnico.id, 10) : null,
      usuario_reporta: formData.usuario_reporta,
      email_contacto: formData.email_contacto,
      titulo: formData.titulo,
      descripcion_problema: formData.descripcion_problema,
      prioridad: formData.prioridad
    };

    try {
      await API.post('/tickets', payload);
      
      setMensaje({
        tipo: 'exito',
        texto: `¡Ticket #${codigoGenerado} registrado y notificado a ${formData.email_contacto || 'área'} con éxito!`
      });

      setFormData({
        usuario_reporta: '',
        email_contacto: '',
        area_id: '',
        categoria_id: '',
        titulo: '',
        prioridad: 'MEDIA',
        descripcion_problema: ''
      });

    } catch (error) {
      console.error('Error al crear ticket:', error);
      const msgError = error.response?.data?.error || 'No se pudo guardar el ticket en la base de datos.';
      setMensaje({ tipo: 'error', texto: msgError });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Crear Nuevo Ticket</h2>

      {mensaje.texto && (
        <div style={{
          ...alertStyle,
          backgroundColor: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          borderColor: mensaje.tipo === 'exito' ? '#047857' : '#dc2626'
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        
        {/* Fila 1: Usuario y Área */}
        <div style={gridTwoColumnsStyle}>
          <div>
            <label style={labelStyle}>Tu Nombre / Usuario:</label>
            <input
              type="text"
              name="usuario_reporta"
              value={formData.usuario_reporta}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Área:</label>
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">-- Seleccionar Área --</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Categoría y Prioridad */}
        <div style={gridTwoColumnsStyle}>
          <div>
            <label style={labelStyle}>Categoría:</label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">-- Seleccionar Categoría --</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Prioridad:</label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>
        </div>

        {/* Fila 3: Título / Asunto */}
        <div>
          <label style={labelStyle}>Título / Asunto:</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej. Falla en impresora de Administración"
            required
            style={inputStyle}
          />
        </div>

        {/* Fila 4: Descripción */}
        <div>
          <label style={labelStyle}>Descripción del Problema:</label>
          <textarea
            name="descripcion_problema"
            value={formData.descripcion_problema}
            onChange={handleChange}
            rows="4"
            placeholder="Detalla lo que está sucediendo..."
            required
            style={{ ...inputStyle, resize: 'vertical' }}
          ></textarea>
        </div>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={cargando}
          style={{
            ...btnStyle,
            backgroundColor: cargando ? '#4b5563' : '#2563eb',
            cursor: cargando ? 'not-allowed' : 'pointer',
            opacity: cargando ? 0.7 : 1
          }}
        >
          {cargando ? 'Guardando Ticket...' : 'Guardar y Registrar Ticket'}
        </button>
      </form>
    </div>
  );
}

// OBJETOS DE ESTILO REUTILIZABLES
const containerStyle = {
  maxWidth: '680px',
  margin: '0 auto',
  padding: '20px',
  boxSizing: 'border-box',
  width: '100%'
};

const titleStyle = {
  textAlign: 'center',
  marginBottom: '1.5rem',
  color: '#f3f4f6',
  fontSize: '1.5rem',
  fontWeight: '700'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const gridTwoColumnsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.25rem',
  width: '100%'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#d1d5db',
  textAlign: 'left'
};

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '6px',
  color: '#f4f4f5',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const alertStyle = {
  padding: '0.85rem',
  marginBottom: '1.25rem',
  textAlign: 'center',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const btnStyle = {
  width: '100%',
  padding: '0.85rem',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.2s ease-in-out',
  marginTop: '0.5rem',
  boxSizing: 'border-box'
};