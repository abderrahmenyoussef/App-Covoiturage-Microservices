const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger le fichier proto du service IA
const IA_PROTO_PATH = path.join(__dirname, '../../../model-proto/ia.proto');
const packageDefinition = protoLoader.loadSync(IA_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const iaProto = grpc.loadPackageDefinition(packageDefinition).ia;

// Créer le client gRPC pour le service IA
const createIaClient = () => {
  const client = new iaProto.PredictionService(
    'service-ia:50053',  // Utiliser le nom de service Docker ou l'IP avec le port
    grpc.credentials.createInsecure()
  );
  return client;
};

// Client gRPC pour le service IA
const iaClient = createIaClient();

/**
 * Prédire le prix d'un trajet en fonction du nombre de places disponibles
 * @param {number} placesDisponibles - Nombre de places disponibles
 * @param {string} depart - Ville de départ (optionnel)
 * @param {string} destination - Ville de destination (optionnel)
 * @returns {Promise<{success: boolean, message: string, prixEstime: number}>}
 */
const predictPrice = (placesDisponibles, depart = '', destination = '') => {
  return new Promise((resolve, reject) => {
    iaClient.PredictPrice({
      placesDisponibles,
      depart,
      destination
    }, (err, response) => {
      if (err) {
        console.error('Erreur lors de la prédiction de prix:', err);
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

module.exports = {
  predictPrice
};