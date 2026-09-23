const pool = require('../config/db');

const selectConJoins = `
  SELECT
    i.*,
    a.nombre AS area_nombre,
    a.correo AS area_correo,
    tec.nombre AS tecnico_nombre
  FROM informes_tecnicos i
  LEFT JOIN areas a ON i.area_id = a.id
  LEFT JOIN tecnicos tec ON i.tecnico_id = tec.id
`;

const InformeModel = {
  create: async (data) => {
    const { area_id, tecnico_id, titulo, fecha_visita, trabajo_realizado, recomendaciones, ticket_id } = data;

    const query = `
      INSERT INTO informes_tecnicos
        (area_id, tecnico_id, titulo, fecha_visita, trabajo_realizado, recomendaciones, ticket_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    const values = [
      area_id,
      tecnico_id,
      titulo,
      fecha_visita,
      trabajo_realizado,
      recomendaciones || null,
      ticket_id || null
    ];

    const result = await pool.query(query, values);
    return InformeModel.getById(result.rows[0].id);
  },

  getAll: async () => {
    const { rows } = await pool.query(`${selectConJoins} ORDER BY i.fecha_visita DESC, i.id DESC;`);
    return rows;
  },

  getById: async (id) => {
    const { rows } = await pool.query(`${selectConJoins} WHERE i.id = $1;`, [id]);
    return rows[0];
  }
};

module.exports = InformeModel;