const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

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

// Configuration du client
const TRAJET_SERVICE_HOST = process.env.TRAJET_SERVICE_HOST || 'localhost';
const TRAJET_SERVICE_PORT = process.env.TRAJET_SERVICE_PORT || '50052';
const trajetClient = new trajetProto.TrajetService(`${TRAJET_SERVICE_HOST}:${TRAJET_SERVICE_PORT}`, 
  grpc.credentials.createInsecure()
);

// Promisifier les méthodes du client gRPC
const createTrajet = (trajetData) => {
  return new Promise((resolve, reject) => {
    trajetClient.createTrajet(trajetData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const getAllTrajets = (filters = {}) => {
  return new Promise((resolve, reject) => {
    trajetClient.getAllTrajets(filters, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const getTrajetById = (id) => {
  return new Promise((resolve, reject) => {
    trajetClient.getTrajetById({ id }, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const getTrajetsByUser = (userId, asPassenger = false) => {
  return new Promise((resolve, reject) => {
    trajetClient.getTrajetsByUser({ userId, asPassenger }, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const updateTrajet = (id, updateData) => {
  return new Promise((resolve, reject) => {
    trajetClient.updateTrajet({ id, ...updateData }, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const deleteTrajet = (id) => {
  return new Promise((resolve, reject) => {
    trajetClient.deleteTrajet({ id }, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const bookTrajet = (bookingData) => {
  return new Promise((resolve, reject) => {
    trajetClient.bookTrajet(bookingData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const cancelBooking = (cancelData) => {
  return new Promise((resolve, reject) => {
    trajetClient.cancelBooking(cancelData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

module.exports = {
  createTrajet,
  getAllTrajets,
  getTrajetById,
  getTrajetsByUser,
  updateTrajet,
  deleteTrajet,
  bookTrajet,
  cancelBooking
};