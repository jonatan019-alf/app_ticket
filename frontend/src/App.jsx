import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import CrearTicket from './pages/CrearTicket';
import Areas from './pages/Areas';
import Categorias from './pages/Categorias';
import Tecnicos from './pages/Tecnicos';
import DetalleTicket from './pages/DetalleTicket';
import HistorialGlobal from './pages/HistorialGlobal';
import InformeTecnico from './pages/InformeTecnico';
import Login from './pages/Login';

// 1. Componente para proteger cualquier ruta privada
function RutaProtegida({ tecnico, children }) {
  if (!tecnico) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 2. Componente para proteger rutas de Administradores
function RutaAdmin({ tecnico, children }) {
  if (!tecnico) {
    return <Navigate to="/login" replace />;
  }

  const esAdmin = tecnico.es_admin === true || tecnico.es_admin === 'true' || tecnico.es_admin === 1;

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 3. Navbar Responsivo con Menú Hamburguesa e Informe Técnico
function Navbar({ tecnico, setTecnico }) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esMobile, setEsMobile] = useState(window.innerWidth <= 768);

  // Escuchar el cambio de tamaño de ventana para adaptar la vista móvil
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setEsMobile(mobile);
      if (!mobile) setMenuAbierto(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tecnico');
    setTecnico(null);
    navigate('/login');
  };

  if (!tecnico) return null;

  const esAdmin = tecnico.es_admin === true || tecnico.es_admin === 'true' || tecnico.es_admin === 1;

  return (
    <nav style={navContainerStyle}>
      <div style={topBarStyle}>
        {/* LOGO */}
        <Link to="/" onClick={() => setMenuAbierto(false)} style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/favicon.png" 
            alt="Logo" 
            style={logoStyle} 
          />
        </Link>

        {/* BOTÓN HAMBURGUESA (Móvil) */}
        {esMobile && (
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)} 
            style={menuToggleBtnStyle}
            aria-label="Toggle Navigation"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* CONTENIDO DE ENLACES Y USUARIO */}
      {(!esMobile || menuAbierto) && (
        <div style={{
          ...linksContainerStyle,
          flexDirection: esMobile ? 'column' : 'row',
          alignItems: esMobile ? 'stretch' : 'center',
          marginTop: esMobile ? '1rem' : '0'
        }}>
          {/* Enlaces principales */}
          <div style={{
            ...mainLinksGroupStyle,
            flexDirection: esMobile ? 'column' : 'row',
            alignItems: esMobile ? 'stretch' : 'center'
          }}>
            <Link to="/" onClick={() => setMenuAbierto(false)} style={linkStyle}>Crear Ticket</Link>
            
            {esAdmin && (
              <>
                <Link to="/areas" onClick={() => setMenuAbierto(false)} style={linkStyle}>Áreas</Link>
                <Link to="/categorias" onClick={() => setMenuAbierto(false)} style={linkStyle}>Categorías</Link>
                <Link to="/tecnicos" onClick={() => setMenuAbierto(false)} style={linkStyle}>Técnicos</Link>
              </>
            )}
            <Link to="/informe-tecnico" onClick={() => setMenuAbierto(false)} style={linkStyle}>Informe Técnico</Link>
            <Link to="/historial" onClick={() => setMenuAbierto(false)} style={linkStyle}>Historial Global</Link>
            
          </div>

          {/* Información del Técnico / Logout */}
          <div style={{
            ...userInfoGroupStyle,
            flexDirection: esMobile ? 'column' : 'row',
            alignItems: esMobile ? 'stretch' : 'center',
            borderTop: esMobile ? '1px solid #3f3f46' : 'none',
            paddingTop: esMobile ? '0.75rem' : '0',
            marginTop: esMobile ? '0.5rem' : '0'
          }}>
            <span style={userTextStyle}>Técnico: <strong>{tecnico.nombre}</strong></span>
            <button
              onClick={handleLogout}
              style={logoutBtnStyle}
            >
              Cerrar Sesión 
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  const [tecnicoLogueado, setTecnicoLogueado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tecnicoGuardado = localStorage.getItem('tecnico');
    if (tecnicoGuardado) {
      setTecnicoLogueado(JSON.parse(tecnicoGuardado));
    }
    setCargando(false);
  }, []);

  if (cargando) return null;

  return (
    <BrowserRouter>
      <Navbar tecnico={tecnicoLogueado} setTecnico={setTecnicoLogueado} />

      <div style={mainContentWrapperStyle}>
        <Routes>
          {/* Ruta pública: Login */}
          <Route
            path="/login"
            element={
              tecnicoLogueado ? (
                <Navigate to="/" replace />
              ) : (
                <Login setTecnicoLogueado={setTecnicoLogueado} />
              )
            }
          />

          {/* Ruta Privada general */}
          <Route
            path="/"
            element={
              <RutaProtegida tecnico={tecnicoLogueado}>
                <CrearTicket />
              </RutaProtegida>
            }
          />

          {/* Rutas Exclusivas para ADMINISTRADORES */}
          <Route
            path="/areas"
            element={
              <RutaAdmin tecnico={tecnicoLogueado}>
                <Areas />
              </RutaAdmin>
            }
          />
          <Route
            path="/categorias"
            element={
              <RutaAdmin tecnico={tecnicoLogueado}>
                <Categorias />
              </RutaAdmin>
            }
          />
          <Route
            path="/tecnicos"
            element={
              <RutaAdmin tecnico={tecnicoLogueado}>
                <Tecnicos />
              </RutaAdmin>
            }
          />

          {/* Rutas Privadas generales */}
          <Route
            path="/historial"
            element={
              <RutaProtegida tecnico={tecnicoLogueado}>
                <HistorialGlobal />
              </RutaProtegida>
            }
          />
          
          <Route
            path="/informe-tecnico"
            element={
              <RutaProtegida tecnico={tecnicoLogueado}>
                <InformeTecnico />
              </RutaProtegida>
            }
          />

          <Route
            path="/tickets/:ticketId"
            element={
              <RutaProtegida tecnico={tecnicoLogueado}>
                <DetalleTicket />
              </RutaProtegida>
            }
          />

          {/* Redirección por defecto */}
          <Route
            path="*"
            element={<Navigate to={tecnicoLogueado ? "/" : "/login"} replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// ESTILOS INLINE DE LA BARRA Y CONTENEDOR
const navContainerStyle = {
  padding: '0.75rem 1rem',
  background: '#18181b',
  color: '#fff',
  borderBottom: '1px solid #27272a',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const logoStyle = {
  height: '40px',
  width: 'auto',
  objectFit: 'contain'
};

const menuToggleBtnStyle = {
  background: '#27272a',
  border: '1px solid #3f3f46',
  color: '#fff',
  fontSize: '1.4rem',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  cursor: 'pointer'
};

const linksContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  width: '100%'
};

const mainLinksGroupStyle = {
  display: 'flex',
  gap: '1rem'
};

const userInfoGroupStyle = {
  display: 'flex',
  gap: '0.8rem'
};

const linkStyle = {
  color: '#f4f4f5',
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: '500',
  padding: '0.4rem 0'
};

const userTextStyle = {
  fontSize: '0.875rem',
  color: '#a1a1aa'
};

const logoutBtnStyle = {
  padding: '0.4rem 0.75rem',
  backgroundColor: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '600'
};

const mainContentWrapperStyle = {
  padding: '1.5rem 1rem',
  width: '100%',
  boxSizing: 'border-box'
};
