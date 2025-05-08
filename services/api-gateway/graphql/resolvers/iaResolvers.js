const { predictPrice } = require('../../src/clients/ia-client');

const iaResolvers = {
  Query: {
    predictPrice: async (_, { input }, context) => {
      try {
        const { placesDisponibles, depart, destination } = input;
        
        // Appeler le service IA via gRPC
        const predictionResponse = await predictPrice({
          placesDisponibles,
          depart: depart || '',
          destination: destination || ''
        });
        
        return predictionResponse;
      } catch (error) {
        console.error('Erreur lors de la prédiction de prix:', error);
        return {
          success: false,
          message: 'Erreur lors de la prédiction de prix',
          prixEstime: 0
        };
      }
    }
  }
};

module.exports = iaResolvers;