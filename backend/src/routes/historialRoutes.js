const express = require('express');
const router = express.Router({ mergeParams: true });
const { 
  getAllHistorial, 
  getHistorialByTicket, 
  createHistorialEntry 
} = require('../controllers/historialController');

// GET /api/historial (Historial global)
router.get('/', getAllHistorial);

// Rutas anidadas bajo /api/tickets/:ticketId/historial
router.get('/tickets/:ticketId/historial', getHistorialByTicket);
router.post('/tickets/:ticketId/historial', createHistorialEntry);

module.exports = router;