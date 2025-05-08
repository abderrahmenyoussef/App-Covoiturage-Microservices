const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const trajetService = require('../services/trajetService');

// Charger le fichier proto
const PROTO_PATH = path.join(__dirname, '../../../model-proto/trajet.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const trajetProto = grpc.loadPackageDefinition(packageDefinition).trajet;

// Implémentation des méthodes du service gRPC
const createTrajet = async (call, callback) => {
  try {
    const result = await trajetService.createTrajet(call.request);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC createTrajet:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const getAllTrajets = async (call, callback) => {
  try {
    const filters = {
      depart: call.request.depart,
      destination: call.request.destination,
      dateDepart: call.request.dateDepart,
      placesMinimum: call.request.placesMinimum,
      prixMax: call.request.prixMax
    };
    const result = await trajetService.getAllTrajets(filters);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC getAllTrajets:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const getTrajetById = async (call, callback) => {
  try {
    const { id } = call.request;
    const result = await trajetService.getTrajetById(id);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC getTrajetById:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const getTrajetsByUser = async (call, callback) => {
  try {
    const { userId, asPassenger } = call.request;
    const result = await trajetService.getTrajetsByUser(userId, asPassenger);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC getTrajetsByUser:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const updateTrajet = async (call, callback) => {
  try {
    const { id, ...updateData } = call.request;
    const result = await trajetService.updateTrajet(id, updateData);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC updateTrajet:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const deleteTrajet = async (call, callback) => {
  try {
    const { id } = call.request;
    const result = await trajetService.deleteTrajet(id);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC deleteTrajet:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const bookTrajet = async (call, callback) => {
  try {
    const { trajetId, passagerId, passagerNom, places } = call.request;
    const result = await trajetService.bookTrajet(trajetId, {
      passagerId,
      passagerNom,
      places
    });
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC bookTrajet:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const cancelBooking = async (call, callback) => {
  try {
    const { trajetId, reservationId, passagerId } = call.request;
    const result = await trajetService.cancelBooking(trajetId, reservationId, passagerId);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC cancelBooking:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

// Démarrer le serveur gRPC
function startGrpcServer(port = '50052') {
  const server = new grpc.Server();
  server.addService(trajetProto.TrajetService.service, {
    createTrajet,
    getAllTrajets,
    getTrajetById,
    getTrajetsByUser,
    updateTrajet,
    deleteTrajet,
    bookTrajet,
    cancelBooking
  });

  server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
  server.start();
  console.log(`Serveur gRPC des trajets démarré sur le port ${port}`);
  return server;
}

module.exports = { startGrpcServer };