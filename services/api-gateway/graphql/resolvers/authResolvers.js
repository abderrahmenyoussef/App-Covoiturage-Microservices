const authClient = require('../../src/clients/auth-client');

const authResolvers = {
  Query: {
    verifyToken: async (_, { token }) => {
      try {
        const response = await authClient.verifyToken({ token });
        return response;
      } catch (error) {
        console.error('GraphQL verifyToken error:', error);
        throw new Error('Erreur lors de la vérification du token');
      }
    }
  },
  Mutation: {
    register: async (_, { input }) => {
      try {
        const response = await authClient.register(input);
        return response;
      } catch (error) {
        console.error('GraphQL register error:', error);
        throw new Error('Erreur lors de l\'inscription');
      }
    },
    login: async (_, { input }) => {
      try {
        const response = await authClient.login(input);
        return response;
      } catch (error) {
        console.error('GraphQL login error:', error);
        throw new Error('Erreur lors de la connexion');
      }
    },
    logout: async (_, { token }) => {
      try {
        const response = await authClient.logout({ token });
        return response;
      } catch (error) {
        console.error('GraphQL logout error:', error);
        throw new Error('Erreur lors de la déconnexion');
      }
    }
  }
};

module.exports = authResolvers;