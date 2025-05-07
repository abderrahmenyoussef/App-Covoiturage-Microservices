const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger le fichier proto
const PROTO_PATH = path.join(__dirname, '../../../model-proto/auth.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// Configuration du client
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST || 'localhost';
const AUTH_SERVICE_PORT = process.env.AUTH_SERVICE_PORT || '50051';
const authClient = new authProto.AuthService(`${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`, 
  grpc.credentials.createInsecure()
);

// Promisifier les méthodes du client gRPC
const register = (userData) => {
  return new Promise((resolve, reject) => {
    authClient.register(userData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const login = (credentials) => {
  return new Promise((resolve, reject) => {
    authClient.login(credentials, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const verifyToken = (tokenData) => {
  return new Promise((resolve, reject) => {
    authClient.verifyToken(tokenData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

const logout = (tokenData) => {
  return new Promise((resolve, reject) => {
    authClient.logout(tokenData, (error, response) => {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
};

module.exports = {
  register,
  login,
  verifyToken,
  logout
};