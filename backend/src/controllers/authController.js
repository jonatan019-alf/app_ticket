const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_tickets';

const loginTecnico = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'El email y la contraseña son obligatorios.' });
  }

  try {
    const emailLimpio = email.trim().toLowerCase();

    const query = 'SELECT id, nombre, email, password, activo, es_admin FROM tecnicos WHERE LOWER(email) = $1;';
    const { rows } = await pool.query(query, [emailLimpio]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const tecnico = rows[0];

    if (!tecnico.activo) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta al administrador.' });
    }

    let passwordMatch = false;

    try {
      passwordMatch = await bcrypt.compare(password, tecnico.password);
    } catch (err) {
      passwordMatch = false;
    }

    if (!passwordMatch && tecnico.password.trim() === password.trim()) {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: tecnico.id, nombre: tecnico.nombre, email: tecnico.email, es_admin: tecnico.es_admin },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      tecnico: {
        id: tecnico.id,
        nombre: tecnico.nombre,
        email: tecnico.email,
        es_admin: tecnico.es_admin
      }
    });

  } catch (error) {
    console.error('❌ ERROR EN LOGIN:', error);
    res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesión.' });
  }
};

module.exports = { loginTecnico };




