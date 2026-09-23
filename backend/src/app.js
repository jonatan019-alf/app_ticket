require('dotenv').config();
const express = require('express');
const cors = require('cors');
const areaRoutes = require('./routes/areaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const tecnicoRoutes = require('./routes/tecnicoRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const historialRoutes = require('./routes/historialRoutes');
const authRoutes = require('./routes/authRoutes');
const informesRoutes = require('./routes/informesRoutes');
 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/areas', areaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets/:ticketId/historial', historialRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/tickets/:ticketId/historial', historialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/informes-tecnicos', informesRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});

module.exports = app;