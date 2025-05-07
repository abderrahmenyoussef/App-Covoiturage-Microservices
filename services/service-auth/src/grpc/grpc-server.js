const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const authService = require('../services/authService');

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

// Implémentation des services gRPC
const register = async (call, callback) => {
  try {
    const { username, email, password, role } = call.request;
    const result = await authService.register(username, email, password, role);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC register:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const login = async (call, callback) => {
  try {
    const { email, password } = call.request;
    const result = await authService.login(email, password);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC login:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const verifyToken = async (call, callback) => {
  try {
    const { token } = call.request;
    const result = await authService.verifyUserToken(token);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC verifyToken:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

const logout = async (call, callback) => {
  try {
    const { token } = call.request;
    const result = await authService.logout(token);
    callback(null, result);
  } catch (error) {
    console.error('Erreur gRPC logout:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Erreur interne du serveur'
    });
  }
};

// Démarrer le serveur gRPC
function startGrpcServer(port = '50051') {
  const server = new grpc.Server();
  server.addService(authProto.AuthService.service, {
    register,
    login,
    verifyToken,
    logout
  });

  server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
  server.start();
  console.log(`Serveur gRPC démarré sur le port ${port}`);
  return server;
}

module.exports = { startGrpcServer };