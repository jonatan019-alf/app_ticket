import { useState, useEffect } from 'react';
import API from '../services/api';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Estados para la edición
  const [idEditando, setIdEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [correoEditado, setCorreoEditado] = useState('');

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. Cargar las áreas al montar el componente
  const obtenerAreas = async () => {
    try {
      const response = await API.get('/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al obtener áreas:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las áreas' });
    }
  };

  useEffect(() => {
    obtenerAreas();
  }, []);

  // 2. Manejar la creación de una nueva área
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await API.post('/areas', { nombre, correo });
      
      setMensaje({ tipo: 'exito', texto: `Área "${response.data.nombre}" creada correctamente.` });
      setNombre('');
      setCorreo('');
      obtenerAreas();
    } catch (error) {
      console.error('Error al crear área:', error);
      const errorMsg = error.response?.data?.error || 'Error al crear el área';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  // 3. Manejar la modificación de un área
  const iniciarEdicion = (area) => {
    setIdEditando(area.id);
    setNombreEditado(area.nombre);
    setCorreoEditado(area.correo || '');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombreEditado('');
    setCorreoEditado('');
  };

  const guardarEdicion = async (id) => {
    setMensaje({ tipo: '', texto: '' });

    try {
      await API.put(`/areas/${id}`, { nombre: nombreEditado, correo: correoEditado });
      setMensaje({ tipo: 'exito', texto: 'Área actualizada correctamente.' });
      setIdEditando(null);
      obtenerAreas();
    } catch (error) {
      console.error('Error al actualizar área:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar el área';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  // 4. Manejar la eliminación de un área
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta área?')) return;

    try {
      await API.delete(`/areas/${id}`);
      setMensaje({ tipo: 'exito', texto: 'Área eliminada correctamente.' });
      obtenerAreas();
    } catch (error) {
      console.error('Error al eliminar área:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar el área';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
      <h2>Gestión de Áreas</h2>

      {/* Mostrar alertas de éxito o error */}
      {mensaje.texto && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'exito' ? '#155724' : '#721c24'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de creación */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Nombre del Área (ej. Sistemas)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <input
          type="email"
          placeholder="Correo del Área (ej. sistemas@empresa.com)"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Crear Área
        </button>
      </form>

      {/* Listado de áreas existentes */}
      <h3>Áreas Registradas</h3>
      {areas.length === 0 ? (
        <p>No hay áreas cargadas aún.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {areas.map((area) => (
            <li 
              key={area.id} 
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                borderBottom: '1px solid #ccc',
                gap: '0.5rem'
              }}
            >
              {idEditando === area.id ? (
                /* Modo edición */
                <>
                  <input
                    type="text"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    style={{ flex: 1, padding: '0.25rem' }}
                  />
                  <input
                    type="email"
                    value={correoEditado}
                    onChange={(e) => setCorreoEditado(e.target.value)}
                    placeholder="Correo de contacto"
                    style={{ flex: 1, padding: '0.25rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => guardarEdicion(area.id)}
                      style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={cancelarEdicion}
                      style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                /* Modo lectura */
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <strong>{area.nombre}</strong>
                    <small style={{ color: '#666' }}>{area.correo || 'Sin correo asignado'}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => iniciarEdicion(area)}
                      style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(area.id)}
                      style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
