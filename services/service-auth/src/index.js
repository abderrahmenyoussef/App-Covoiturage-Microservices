const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const { initDatabase } = require('./database/sqlite');
const { connectRedis } = require('./database/redis');
const { startGrpcServer } = require('./grpc/grpc-server');

// Initialisation de l'application Express
const app = express();

// Middleware pour le logging
app.use(morgan('dev'));

// Middleware pour parser le JSON
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'Service d\'authentification opérationnel' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

// Port gRPC
const GRPC_PORT = process.env.GRPC_PORT || '50051';

// Démarrage du serveur
async function startServer() {
  try {
    // Initialiser la base de données SQLite
    initDatabase();
    
    // Connexion à Redis
    await connectRedis();
    
    // Démarrer le serveur HTTP
    app.listen(config.port, () => {
      console.log(`Service d'authentification HTTP démarré sur le port ${config.port}`);
    });
    
    // Démarrer le serveur gRPC
    startGrpcServer(GRPC_PORT);
    console.log(`Service d'authentification gRPC démarré sur le port ${GRPC_PORT}`);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrage de l'application
startServer();