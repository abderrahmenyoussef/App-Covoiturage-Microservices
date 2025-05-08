// Configuration du service de trajets
require('dotenv').config();

module.exports = {
  // Configuration MongoDB
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/covoiturage_trajets',
  
  // Configuration du serveur gRPC
  grpc: {
    port: process.env.GRPC_PORT || '50052',
    host: process.env.GRPC_HOST || '0.0.0.0'
  }
};