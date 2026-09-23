import { useState, useEffect } from 'react';
import API from '../services/api';

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    es_admin: false
  });

  // Visibilidad de contraseña
  const [mostrarPassCrear, setMostrarPassCrear] = useState(false);
  const [mostrarPassEditar, setMostrarPassEditar] = useState(false);
  const [verPassTabla, setVerPassTabla] = useState({});

  // Estado para controlar qué técnico se está editando
  const [editandoId, setEditandoId] = useState(null);
  const [editData, setEditData] = useState({
    nombre: '',
    email: '',
    password: '',
    activo: true,
    es_admin: false
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarTecnicos = async () => {
    try {
      const res = await API.get('/tecnicos');
      setTecnicos(res.data);
    } catch (error) {
      console.error('Error al cargar técnicos:', error);
    }
  };

  useEffect(() => {
    cargarTecnicos();
  }, []);

  const toggleVerPassTabla = (id) => {
    setVerPassTabla(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Manejadores para el formulario de Creación
  const handleChangeCrear = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitCrear = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      await API.post('/tecnicos', formData);
      setMensaje({ tipo: 'exito', texto: 'Técnico creado exitosamente.' });
      setFormData({ nombre: '', email: '', password: '', es_admin: false });
      setMostrarPassCrear(false);
      cargarTecnicos();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al guardar técnico.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  // Manejadores para la Edición
  const iniciarEdicion = (tec) => {
    setEditandoId(tec.id);
    setMostrarPassEditar(false);
    setEditData({
      nombre: tec.nombre,
      email: tec.email,
      password: '',
      activo: tec.activo,
      es_admin: tec.es_admin
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const handleChangeEditar = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData({
      ...editData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleGuardarEdicion = async (id) => {
    setMensaje({ tipo: '', texto: '' });
    try {
      await API.put(`/tecnicos/${id}`, editData);
      setMensaje({ tipo: 'exito', texto: 'Técnico actualizado correctamente.' });
      setEditandoId(null);
      cargarTecnicos();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al actualizar técnico.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este técnico?')) return;
    setMensaje({ tipo: '', texto: '' });

    try {
      await API.delete(`/tecnicos/${id}`);
      setMensaje({ tipo: 'exito', texto: 'Técnico eliminado correctamente.' });
      cargarTecnicos();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'No se pudo eliminar el técnico.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem', boxSizing: 'border-box' }}>
      <h2 style={{ textAlign: 'center' }}>Gestión de Técnicos</h2>

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

      {/* Formulario de Creación con ancho reducido (450px max) */}
      <form 
        onSubmit={handleSubmitCrear} 
        autoComplete="off"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem', 
          marginBottom: '2rem',
          maxWidth: '450px',
          margin: '0 auto 2rem auto'
        }}
      >
        <h3 style={{ textAlign: 'center' }}>Agregar Nuevo Técnico</h3>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={formData.nombre}
          onChange={handleChangeCrear}
          autoComplete="off"
          required
          style={{ padding: '0.45rem 0.6rem', width: '100%', boxSizing: 'border-box' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChangeCrear}
          autoComplete="new-password"
          required
          style={{ padding: '0.45rem 0.6rem', width: '100%', boxSizing: 'border-box' }}
        />
        
        {/* Campo contraseña con toggle */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            type={mostrarPassCrear ? 'text' : 'password'}
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChangeCrear}
            autoComplete="new-password"
            required
            style={{ padding: '0.45rem 0.6rem', width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => setMostrarPassCrear(!mostrarPassCrear)}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aaa',
              fontSize: '1rem'
            }}
            title={mostrarPassCrear ? "Ocultar" : "Mostrar"}
          >
            {mostrarPassCrear ? '👁️‍🗨️' : '👁️'}
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="es_admin"
            checked={formData.es_admin}
            onChange={handleChangeCrear}
          />
          ¿Es Administrador?
        </label>
        <button type="submit" style={{ padding: '0.6rem', backgroundColor: '#0d6efd', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
          Guardar Técnico
        </button>
      </form>

      <hr style={{ margin: '2rem 0', borderColor: '#333' }} />

      {/* Lista de Técnicos en contenedor con scroll horizontal para celulares */}
      <h3 style={{ textAlign: 'center' }}>Lista de Técnicos</h3>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#222', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Nombre</th>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Clave / Nueva Clave</th>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Estado</th>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Rol</th>
              <th style={{ padding: '8px', border: '1px solid #444' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tecnicos.map((tec) => (
              <tr key={tec.id} style={{ borderBottom: '1px solid #444' }}>
                {editandoId === tec.id ? (
                  <>
                    {/* Fila en modo Edición */}
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        name="nombre"
                        value={editData.nombre}
                        onChange={handleChangeEditar}
                        autoComplete="off"
                        style={{ width: '130px', padding: '0.3rem', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleChangeEditar}
                        autoComplete="off"
                        style={{ width: '150px', padding: '0.3rem', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '140px' }}>
                        <input
                          type={mostrarPassEditar ? 'text' : 'password'}
                          name="password"
                          placeholder="Nueva clave"
                          value={editData.password}
                          onChange={handleChangeEditar}
                          autoComplete="new-password"
                          style={{ width: '100%', padding: '0.3rem', paddingRight: '1.8rem', boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassEditar(!mostrarPassEditar)}
                          style={{
                            position: 'absolute',
                            right: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#aaa',
                            fontSize: '0.85rem'
                          }}
                          title={mostrarPassEditar ? "Ocultar" : "Mostrar"}
                        >
                          {mostrarPassEditar ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="activo"
                          checked={editData.activo}
                          onChange={handleChangeEditar}
                        />
                        Activo
                      </label>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="es_admin"
                          checked={editData.es_admin}
                          onChange={handleChangeEditar}
                        />
                        Admin
                      </label>
                    </td>
                    <td style={{ padding: '8px', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleGuardarEdicion(tec.id)}
                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* Fila en modo Lectura */}
                    <td style={{ padding: '8px' }}>{tec.nombre}</td>
                    <td style={{ padding: '8px' }}>{tec.email}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', letterSpacing: verPassTabla[tec.id] ? 'normal' : '1px' }}>
                          {verPassTabla[tec.id] ? (tec.password || '••••••••') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleVerPassTabla(tec.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#aaa',
                            fontSize: '0.85rem'
                          }}
                          title={verPassTabla[tec.id] ? "Ocultar" : "Ver contraseña"}
                        >
                          {verPassTabla[tec.id] ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: tec.activo ? '#198754' : '#dc3545', fontWeight: 'bold' }}>
                        {tec.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{tec.es_admin ? 'Admin' : 'Técnico'}</td>
                    <td style={{ padding: '8px', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => iniciarEdicion(tec)}
                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(tec.id)}
                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
