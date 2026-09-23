//TTTTT///
const Area = require('../models/areaModel');

const getAreas = async (req, res) => {
  try {
    const areas = await Area.getAll();
    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las áreas: ' + error.message });
  }
};

const createArea = async (req, res) => {
  const { nombre, correo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  }

  try {
    const nuevaArea = await Area.create(nombre, correo); 
    res.status(201).json(nuevaArea);
  } catch (error) {
    console.error('❌ ERROR DETALLADO EN EL CONTROLADOR:', error);

    res.status(500).json({ 
      error: 'Error al crear el área',
      mensaje: error.message || error.toString(),
      detalle: error.detail || null,
      codigo: error.code || null
    });
  }
};

const updateArea = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  }

  try {
    const areaActualizada = await Area.update(id, nombre, correo);

    if (!areaActualizada) {
      return res.status(404).json({ error: 'El área no existe' });
    }

    res.status(200).json({
      mensaje: 'Área actualizada correctamente',
      area: areaActualizada
    });
  } catch (error) {
    console.error('❌ ERROR AL ACTUALIZAR ÁREA:', error);
    res.status(500).json({ error: 'Error al actualizar el área: ' + error.message });
  }
};

const deleteArea = async (req, res) => {
  const { id } = req.params;

  try {
    const areaEliminada = await Area.delete(id);

    if (!areaEliminada) {
      return res.status(404).json({ error: 'El área no existe' });
    }

    res.status(200).json({
      mensaje: 'Área eliminada correctamente',
      area: areaEliminada
    });
  } catch (error) {
    console.error('❌ ERROR AL ELIMINAR ÁREA:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar el área porque está asociada a usuarios o tickets.'
      });
    }

    res.status(500).json({ error: 'Error al eliminar el área: ' + error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea
};

// const Area = require('../models/areaModel');

// const getAreas = async (req, res) => {
//   try {
//     const areas = await Area.getAll();
//     res.status(200).json(areas);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al obtener las áreas: ' + error.message });
//   }
// };

// const createArea = async (req, res) => {
//   const { nombre } = req.body;

//   // Validación: El nombre del área es obligatorio
//   if (!nombre) {
//     return res.status(400).json({ error: 'El nombre del área es obligatorio' });
//   }

//   try {
//     const nuevaArea = await Area.create(nombre); 
//     res.status(201).json(nuevaArea);
//   } catch (error) {
//     // 1. Imprime el error completo en la consola de VS Code
//     console.error('❌ ERROR DETALLADO EN EL CONTROLADOR:', error);

//     // 2. Devuelve todos los detalles disponibles en Postman
//     res.status(500).json({ 
//       error: 'Error al crear el área',
//       mensaje: error.message || error.toString(),
//       detalle: error.detail || null,
//       codigo: error.code || null
//     });
//   }
// };

// // Actualizar área
// const updateArea = async (req, res) => {
//   const { id } = req.params;
//   const { nombre } = req.body;

//   if (!nombre) {
//     return res.status(400).json({ error: 'El nombre del área es obligatorio' });
//   }

//   try {
//     const areaActualizada = await Area.update(id, nombre);

//     if (!areaActualizada) {
//       return res.status(404).json({ error: 'El área no existe' });
//     }

//     res.status(200).json({
//       mensaje: 'Área actualizada correctamente',
//       area: areaActualizada
//     });
//   } catch (error) {
//     console.error('❌ ERROR AL ACTUALIZAR ÁREA:', error);
//     res.status(500).json({ error: 'Error al actualizar el área: ' + error.message });
//   }
// };

// // Eliminar área
// const deleteArea = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const areaEliminada = await Area.delete(id);

//     if (!areaEliminada) {
//       return res.status(404).json({ error: 'El área no existe' });
//     }

//     res.status(200).json({
//       mensaje: 'Área eliminada correctamente',
//       area: areaEliminada
//     });
//   } catch (error) {
//     console.error('❌ ERROR AL ELIMINAR ÁREA:', error);

//     // Código 23503: Violación de Foreign Key
//     if (error.code === '23503') {
//       return res.status(400).json({
//         error: 'No se puede eliminar el área porque está asociada a usuarios o tickets.'
//       });
//     }

//     res.status(500).json({ error: 'Error al eliminar el área: ' + error.message });
//   }
// };





// module.exports = {
//   getAreas,
//   createArea,
//   updateArea,
//   deleteArea
// };


// const createArea = async (req, res) => {
//   const { nombre } = req.body;

//   // Validación: El nombre del área es obligatorio
//   if (!nombre) {
//     return res.status(400).json({ error: 'El nombre del área es obligatorio' });
//   }

//   try {
//     // Quitamos 'descripcion' de los parámetros ya que tu modelo ahora solo espera el nombre
//     const nuevaArea = await Area.create(nombre); 
//     res.status(201).json(nuevaArea);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al crear el área: ' + error.message });
//   }
// };