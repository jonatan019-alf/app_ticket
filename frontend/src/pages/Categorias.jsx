import { useState, useEffect } from 'react';
import API from '../services/api';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  
  // Estados para la edición
  const [idEditando, setIdEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. Cargar las categorías al cargar la página
  const obtenerCategorias = async () => {
    try {
      const response = await API.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las categorías' });
    }
  };

  useEffect(() => {
    obtenerCategorias();
  }, []);

  // 2. Crear una nueva categoría
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await API.post('/categorias', { nombre });
      setMensaje({ tipo: 'exito', texto: `Categoría "${response.data.nombre}" creada correctamente.` });
      setNombre('');
      obtenerCategorias();
    } catch (error) {
      console.error('Error al crear categoría:', error);
      const errorMsg = error.response?.data?.error || 'Error al crear la categoría';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  // 3. Modificar una categoría
  const iniciarEdicion = (cat) => {
    setIdEditando(cat.id);
    setNombreEditado(cat.nombre);
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombreEditado('');
  };

  const guardarEdicion = async (id) => {
    setMensaje({ tipo: '', texto: '' });

    try {
      await API.put(`/categorias/${id}`, { nombre: nombreEditado });
      setMensaje({ tipo: 'exito', texto: 'Categoría actualizada correctamente.' });
      setIdEditando(null);
      obtenerCategorias();
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar la categoría';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  // 4. Eliminar una categoría
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      await API.delete(`/categorias/${id}`);
      setMensaje({ tipo: 'exito', texto: 'Categoría eliminada correctamente.' });
      obtenerCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar la categoría';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>Gestión de Categorías</h2>

      {/* Mostrar mensaje de feedback */}
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
          placeholder="Nueva Categoría (ej. Hardware, Redes)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Crear Categoría
        </button>
      </form>

      {/* Lista de categorías */}
      <h3>Categorías Registradas</h3>
      {categorias.length === 0 ? (
        <p>No hay categorías cargadas aún.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {categorias.map((cat) => (
            <li 
              key={cat.id} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                borderBottom: '1px solid #ccc',
                gap: '0.5rem'
              }}
            >
              {idEditando === cat.id ? (
                /* Modo edición */
                <>
                  <input
                    type="text"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    style={{ flex: 1, padding: '0.25rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => guardarEdicion(cat.id)}
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
                  <span><strong>{cat.nombre}</strong></span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => iniciarEdicion(cat)}
                      style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
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