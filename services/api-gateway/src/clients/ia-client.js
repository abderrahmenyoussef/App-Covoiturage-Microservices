const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger le fichier proto
const PROTO_PATH = path.join(__dirname, '../../../model-proto/ia.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const iaProto = grpc.loadPackageDefinition(packageDefinition).ia;

// Configuration du client
const IA_SERVICE_HOST = process.env.IA_SERVICE_HOST || 'localhost';
const IA_SERVICE_PORT = process.env.IA_SERVICE_PORT || '50053';
const iaClient = new iaProto.PredictionService(`${IA_SERVICE_HOST}:${IA_SERVICE_PORT}`, 
  grpc.credentials.createInsecure()
);

// Promisifier les méthodes du client gRPC
const predictPrice = (predictionData) => {
  return new Promise((resolve, reject) => {
    iaClient.PredictPrice(predictionData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

module.exports = {
  predictPrice
};