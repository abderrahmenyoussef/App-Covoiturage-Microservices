const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('../routes/auth-routes');

// Chargement des variables d'environnement
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway pour l\'application de covoiturage' });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`API Gateway démarré sur le port ${PORT}`);
});