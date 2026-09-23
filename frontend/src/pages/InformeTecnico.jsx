import { useState, useEffect, useMemo } from 'react';
import API from '../services/api';

const fechaHoy = () => new Date().toISOString().split('T')[0];

const formatearFecha = (valor) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString('es-AR');
};

const fechaISO = (valor) => {
  if (!valor) return '';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toISOString().split('T')[0];
};

export default function InformeTecnico() {
  const [areas, setAreas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [informes, setInformes] = useState([]);
  const [modoImpresion, setModoImpresion] = useState(false);
  const [informeVista, setInformeVista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const [formData, setFormData] = useState({
    area_id: '',
    tecnico_id: '',
    titulo: '',
    fecha_visita: fechaHoy(),
    trabajo_realizado: '',
    recomendaciones: ''
  });

  const [filtros, setFiltros] = useState({
    texto: '',
    area_id: '',
    tecnico_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState(null);

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarInformes = async () => {
    setBuscando(true);
    try {
      const res = await API.get('/informes-tecnicos');
      setInformes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error al cargar informes:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los informes técnicos.' });
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    const cargarCombos = async () => {
      try {
        const [resAreas, resTecnicos] = await Promise.all([
          API.get('/areas'),
          API.get('/tecnicos')
        ]);
        setAreas(resAreas.data);
        setTecnicos(resTecnicos.data);
      } catch (error) {
        console.error('Error al cargar combos:', error);
        setMensaje({ tipo: 'error', texto: 'Error al cargar áreas y técnicos.' });
      }
    };
    cargarCombos();
    cargarInformes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'area_id') {
      const areaSeleccionada = areas.find((a) => a.id === parseInt(value, 10));
      setFormData((prev) => ({
        ...prev,
        area_id: value,
        titulo: areaSeleccionada ? `Informe técnico de ${areaSeleccionada.nombre}` : 'Informe técnico de '
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    setFiltrosAplicados({ ...filtros });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      texto: '',
      area_id: '',
      tecnico_id: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setFiltrosAplicados(null);
  };

  const informesFiltrados = useMemo(() => {
    if (!filtrosAplicados) return [];

    const texto = filtrosAplicados.texto.trim().toLowerCase();

    return informes.filter((informe) => {
      const coincideTexto = !texto ||
        informe.titulo?.toLowerCase().includes(texto) ||
        informe.trabajo_realizado?.toLowerCase().includes(texto) ||
        informe.recomendaciones?.toLowerCase().includes(texto) ||
        informe.area_nombre?.toLowerCase().includes(texto);

      const coincideArea = !filtrosAplicados.area_id ||
        String(informe.area_id) === String(filtrosAplicados.area_id);

      const coincideTecnico = !filtrosAplicados.tecnico_id ||
        String(informe.tecnico_id) === String(filtrosAplicados.tecnico_id);

      const fechaInforme = fechaISO(informe.fecha_visita);
      const coincideDesde = !filtrosAplicados.fecha_desde || fechaInforme >= filtrosAplicados.fecha_desde;
      const coincideHasta = !filtrosAplicados.fecha_hasta || fechaInforme <= filtrosAplicados.fecha_hasta;

      return coincideTexto && coincideArea && coincideTecnico && coincideDesde && coincideHasta;
    });
  }, [informes, filtrosAplicados]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setCargando(true);

    try {
      const payload = {
        area_id: parseInt(formData.area_id, 10),
        tecnico_id: parseInt(formData.tecnico_id, 10),
        titulo: formData.titulo,
        fecha_visita: formData.fecha_visita,
        trabajo_realizado: formData.trabajo_realizado,
        recomendaciones: formData.recomendaciones
      };

      const { data } = await API.post('/informes-tecnicos', payload);
      await cargarInformes();

      setInformeVista(null);
      setMensaje({
        tipo: 'exito',
        texto: data?.area_correo
          ? 'Informe registrado. Se envió el correo al área.'
          : 'Informe registrado. El área no tiene correo cargado, no se envió mail.'
      });

      setModoImpresion(true);
    } catch (error) {
      console.error('Error al guardar informe:', error);
      const msgError = error.response?.data?.error || 'No se pudo guardar el informe técnico.';
      setMensaje({ tipo: 'error', texto: msgError });
    } finally {
      setCargando(false);
    }
  };

  const verInforme = (informe) => {
    setInformeVista(informe);
    setModoImpresion(true);
  };

  const volverAlFormulario = () => {
    setModoImpresion(false);
    setInformeVista(null);
  };

  const datosVista = informeVista || formData;
  const tecnicoVista = tecnicos.find((t) => t.id === parseInt(datosVista.tecnico_id, 10));
  const nombreTecnicoVista = informeVista?.tecnico_nombre || tecnicoVista?.nombre || 'Soporte Técnico';

  return (
    <div style={containerStyle}>
      {!modoImpresion ? (
        <>
          <section style={filtrosBoxStyle}>
            <h3 style={filtrosTitleStyle}>Buscar informes técnicos</h3>
            <form onSubmit={handleBuscar} style={formStyle}>
              <div>
                <label style={labelStyle}>Texto (título o contenido):</label>
                <input
                  type="text"
                  name="texto"
                  value={filtros.texto}
                  onChange={handleFiltroChange}
                  placeholder="Buscar por título, área o trabajo realizado"
                  style={inputStyle}
                />
              </div>

              <div style={gridTwoColumnsStyle}>
                <div>
                  <label style={labelStyle}>Área:</label>
                  <select
                    name="area_id"
                    value={filtros.area_id}
                    onChange={handleFiltroChange}
                    style={inputStyle}
                  >
                    <option value="">Todas</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Técnico:</label>
                  <select
                    name="tecnico_id"
                    value={filtros.tecnico_id}
                    onChange={handleFiltroChange}
                    style={inputStyle}
                  >
                    <option value="">Todos</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={gridTwoColumnsStyle}>
                <div>
                  <label style={labelStyle}>Fecha desde:</label>
                  <input
                    type="date"
                    name="fecha_desde"
                    value={filtros.fecha_desde}
                    onChange={handleFiltroChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fecha hasta:</label>
                  <input
                    type="date"
                    name="fecha_hasta"
                    value={filtros.fecha_hasta}
                    onChange={handleFiltroChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={filtrosActionsStyle}>
                <button type="submit" style={{ ...btnStyle, marginTop: 0, backgroundColor: '#2563eb' }}>
                  {buscando ? 'Buscando...' : 'Buscar'}
                </button>
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  style={{ ...btnStyle, marginTop: 0, backgroundColor: '#4b5563' }}
                >
                  Limpiar
                </button>
              </div>
            </form>

            {filtrosAplicados && (
              <div style={{ marginTop: '1.25rem' }}>
                {informesFiltrados.length === 0 ? (
                  <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>
                    No se encontraron informes con esos filtros.
                  </p>
                ) : (
                  <ul style={listaInformesStyle}>
                    {informesFiltrados.map((informe) => (
                      <li key={informe.id} style={itemInformeStyle}>
                        <div>
                          <strong style={{ color: '#f4f4f5' }}>{informe.titulo}</strong>
                          <p style={itemMetaStyle}>
                            {informe.area_nombre || 'Sin área'} · {informe.tecnico_nombre || 'Sin técnico'} · {formatearFecha(informe.fecha_visita)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => verInforme(informe)}
                          style={btnVerStyle}
                        >
                          Ver
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <h2 style={titleStyle}>Crear Informe Técnico</h2>

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
            <div style={gridTwoColumnsStyle}>
              <div>
                <label style={labelStyle}>Área / Dependencia:</label>
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

              <div>
                <label style={labelStyle}>Técnico Responsable:</label>
                <select
                  name="tecnico_id"
                  value={formData.tecnico_id}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Seleccionar Técnico --</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={gridTwoColumnsStyle}>
              <div>
                <label style={labelStyle}>Título del Informe:</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Fecha de Visita:</label>
                <input
                  type="date"
                  name="fecha_visita"
                  value={formData.fecha_visita}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Trabajo Realizado / Diagnóstico:</label>
              <textarea
                name="trabajo_realizado"
                value={formData.trabajo_realizado}
                onChange={handleChange}
                rows="5"
                placeholder=""
                required
                style={{ ...inputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

            <div>
              <label style={labelStyle}>Observaciones / Recomendaciones:</label>
              <textarea
                name="recomendaciones"
                value={formData.recomendaciones}
                onChange={handleChange}
                rows="4"
                placeholder="Se recomienda la compra de un UPS..."
                style={{ ...inputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

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
              {cargando ? 'Guardando Informe...' : 'Guardar y Ver Vista Previa'}
            </button>
          </form>
        </>
      ) : (
        <div>
          <div className="no-print" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.print()}
              style={{ ...btnStyle, backgroundColor: '#059669', flex: 1, marginTop: 0 }}
            >
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={volverAlFormulario}
              style={{ ...btnStyle, backgroundColor: '#4b5563', flex: 1, marginTop: 0 }}
            >
              Volver al Formulario
            </button>
          </div>

          {mensaje.texto && !informeVista && (
            <div className="no-print" style={{
              ...alertStyle,
              backgroundColor: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              borderColor: mensaje.tipo === 'exito' ? '#047857' : '#dc2626'
            }}>
              {mensaje.texto}
            </div>
          )}

          <div style={hojaStyle}>
            <div style={headerStyle}>
              <strong>OFICINA DE CÓMPUTOS</strong>
              <span>Guernica, {formatearFecha(datosVista.fecha_visita)}</span>
            </div>

            <div style={boxStyle}>
              <div style={boxHeaderStyle}>INFORME DE EQUIPO INFORMÁTICO</div>
              <div style={boxBodyStyle}>{datosVista.titulo}</div>
            </div>

            <div style={contentStyle}>
              <h3 style={{ textTransform: 'uppercase', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                INFORME TÉCNICO
              </h3>

              <p style={{ marginBottom: '1rem' }}>
              
              </p>

              {/* SECCIÓN TRABAJO REALIZADO */}
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Trabajo Realizado / Diagnóstico:</strong>
                <div style={{ whiteSpace: 'pre-line' }}>
                  {datosVista.trabajo_realizado}
                </div>
              </div>

              {/* SECCIÓN OBSERVACIONES / RECOMENDACIONES */}
              {datosVista.recomendaciones && (
                <div style={{ marginTop: '1.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Observaciones / Recomendaciones:</strong>
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {datosVista.recomendaciones}
                  </div>
                </div>
              )}
            </div>

            <div style={firmaStyle}>
              <strong>{nombreTecnicoVista}</strong>
              <span>Soporte Técnico</span>
              <span>Municipalidad de Pte. Perón</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  maxWidth: '780px',
  margin: '0 auto',
  padding: '20px',
  boxSizing: 'border-box',
  width: '100%'
};

const titleStyle = {
  textAlign: 'center',
  marginBottom: '1.5rem',
  marginTop: '2rem',
  color: '#f3f4f6',
  fontSize: '1.5rem',
  fontWeight: '700'
};

const filtrosBoxStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  padding: '1.25rem',
  marginBottom: '0.5rem'
};

const filtrosTitleStyle = {
  color: '#f3f4f6',
  fontSize: '1.05rem',
  fontWeight: '700',
  margin: '0 0 1rem 0'
};

const filtrosActionsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.75rem'
};

const listaInformesStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem'
};

const itemInformeStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '6px'
};

const itemMetaStyle = {
  margin: '0.35rem 0 0',
  color: '#a1a1aa',
  fontSize: '0.8rem'
};

const btnVerStyle = {
  padding: '0.4rem 0.85rem',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.85rem',
  flexShrink: 0
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

const hojaStyle = {
  width: '210mm',
  minHeight: '297mm',
  padding: '20mm',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  color: '#000000',
  boxSizing: 'border-box',
  borderRadius: '4px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.95rem',
  marginBottom: '2.5rem'
};

const boxStyle = {
  border: '1.5px solid #000000',
  marginBottom: '2.5rem'
};

const boxHeaderStyle = {
  fontWeight: 'bold',
  fontSize: '1.1rem',
  padding: '0.6rem',
  borderBottom: '1.5px solid #000000'
};

const boxBodyStyle = {
  fontWeight: 'bold',
  fontSize: '1rem',
  padding: '0.6rem'
};

const contentStyle = {
  lineHeight: '1.6',
  fontSize: '1rem',
  textAlign: 'justify'
};

const firmaStyle = {
  marginTop: '6rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  fontSize: '1rem'
};