import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Login({ setTecnicoLogueado }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await API.post('/auth/login', { email, password });
      
      const { token, tecnico } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('tecnico', JSON.stringify(tecnico));

      if (setTecnicoLogueado) setTecnicoLogueado(tecnico);

      navigate('/');

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      const msg = err.response?.data?.error || 'No se pudo iniciar sesión.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* SECCIÓN DEL LOGO */}
      <div style={{ textCenter: 'center', marginBottom: '1.25rem', textAlign: 'center' }}>
        <img 
          src="/favicon.png" 
          alt="Logo Empresa" 
          style={{ height: '300px', width: 'auto', objectFit: 'contain' }} 
        />
      </div>

      <h2 style={titleStyle}>Acceso Técnicos</h2>

      {error && (
        <div style={alertErrorStyle}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle}>Correo Electrónico:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tecnico@empresa.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={inputStyle}
          />
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
          {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}

// ESTILOS EN LÍNEA ALINEADOS A TU TEMA OSCURO
const containerStyle = {
  maxWidth: '400px',
  margin: '4rem auto',
  padding: '2rem',
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  boxSizing: 'border-box'
};

const titleStyle = {
  textAlign: 'center',
  marginBottom: '1.5rem',
  color: '#f4f4f5',
  fontSize: '1.4rem',
  fontWeight: '700'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#d1d5db'
};

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  backgroundColor: '#09090b',
  border: '1px solid #3f3f46',
  borderRadius: '6px',
  color: '#f4f4f5',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const btnStyle = {
  width: '100%',
  padding: '0.75rem',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.95rem',
  fontWeight: '600',
  marginTop: '0.5rem',
  boxSizing: 'border-box'
};

const alertErrorStyle = {
  padding: '0.75rem',
  marginBottom: '1rem',
  backgroundColor: '#991b1b',
  color: '#ffffff',
  borderColor: '#dc2626',
  borderRadius: '6px',
  fontSize: '0.875rem',
  textAlign: 'center'
};
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import API from '../services/api';

// // ⚠️ ASEGÚRATE DE QUE DICE: "export default function Login..."
// export default function Login({ setTecnicoLogueado }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [cargando, setCargando] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setCargando(true);

//     try {
//       const response = await API.post('/auth/login', { email, password });
      
//       const { token, tecnico } = response.data;

//       localStorage.setItem('token', token);
//       localStorage.setItem('tecnico', JSON.stringify(tecnico));

//       if (setTecnicoLogueado) setTecnicoLogueado(tecnico);

//       navigate('/');

//     } catch (err) {
//       console.error('Error al iniciar sesión:', err);
//       const msg = err.response?.data?.error || 'No se pudo iniciar sesión.';
//       setError(msg);
//     } finally {
//       setCargando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '400px', margin: '3rem auto', padding: '1.5rem', border: '1px solid #333', borderRadius: '6px' }}>
//       <h2>Acceso Técnicos</h2>

//       {error && (
//         <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//         <div>
//           <label style={{ display: 'block', marginBottom: '0.3rem' }}>Correo Electrónico:</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             placeholder="tecnico@empresa.com"
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>

//         <div>
//           <label style={{ display: 'block', marginBottom: '0.3rem' }}>Contraseña:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             placeholder="••••••••"
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={cargando}
//           style={{
//             padding: '0.6rem',
//             backgroundColor: cargando ? '#6c757d' : '#0d6efd',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: cargando ? 'not-allowed' : 'pointer'
//           }}
//         >
//           {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
//         </button>
//       </form>
//     </div>
//   );
// }

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import API from '../services/api';

// export default function Login({ setTecnicoLogueado }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [cargando, setCargando] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setCargando(true);

//     try {
//       const response = await API.post('/auth/login', { email, password });
      
//       const { token, tecnico } = response.data;

//       // Guardar token y usuario en localStorage
//       localStorage.setItem('token', token);
//       localStorage.setItem('tecnico', JSON.stringify(tecnico));

//       // Actualizar estado global y redirigir
//       if (setTecnicoLogueado) setTecnicoLogueado(tecnico);
//       navigate('/historial');

//     } catch (err) {
//       console.error('Error al iniciar sesión:', err);
//       const msg = err.response?.data?.error || 'No se pudo iniciar sesión.';
//       setError(msg);
//     } finally {
//       setCargando(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: '400px', margin: '3rem auto', padding: '1.5rem', border: '1px solid #333', borderRadius: '6px' }}>
//       <h2>Acceso Técnicos</h2>

//       {error && (
//         <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//         <div>
//           <label style={{ display: 'block', marginBottom: '0.3rem' }}>Correo Electrónico:</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             placeholder="tecnico@empresa.com"
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>

//         <div>
//           <label style={{ display: 'block', marginBottom: '0.3rem' }}>Contraseña:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             placeholder="••••••••"
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={cargando}
//           style={{
//             padding: '0.6rem',
//             backgroundColor: cargando ? '#6c757d' : '#0d6efd',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: cargando ? 'not-allowed' : 'pointer'
//           }}
//         >
//           {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
//         </button>
//       </form>
//     </div>
//   );
// }