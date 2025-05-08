const { connectDB } = require('./database/mongodb');
const { startGrpcServer } = require('./grpc/grpc-server');
const config = require('./config');

// Fonction principale pour démarrer le service
async function startService() {
  try {
    // Connexion à MongoDB
    await connectDB();
    
    // Démarrage du serveur gRPC
    startGrpcServer(config.grpc.port);
    
    console.log('Service de trajets démarré avec succès');
  } catch (error) {
    console.error('Erreur lors du démarrage du service:', error);
    process.exit(1);
  }
}

// Démarrage du service
startService();