const trajetClient = require('../../src/clients/trajet-client');
const { verifyToken } = require('../../src/clients/auth-client');

// Vérifier si l'utilisateur est authentifié
const checkAuth = async (context) => {
  if (!context.token) {
    throw new Error("Non authentifié. Veuillez vous connecter.");
  }
  
  try {
    const verifyResult = await verifyToken({ token: context.token });
    
    if (!verifyResult.success) {
      throw new Error("Token non valide. Veuillez vous reconnecter.");
    }
    
    return verifyResult.user;
  } catch (error) {
    throw new Error("Erreur d'authentification: " + error.message);
  }
};

const trajetResolvers = {
  Query: {
    // Récupérer tous les trajets avec filtres optionnels
    trajets: async (_, { filters = {} }) => {
      try {
        const result = await trajetClient.getAllTrajets(filters);
        return result;
      } catch (error) {
        console.error('Erreur lors de la récupération des trajets:', error);
        return {
          success: false,
          message: 'Erreur lors de la récupération des trajets',
          trajets: []
        };
      }
    },
    
    // Récupérer un trajet par son ID
    trajet: async (_, { id }) => {
      try {
        const result = await trajetClient.getTrajetById(id);
        return result;
      } catch (error) {
        console.error(`Erreur lors de la récupération du trajet ${id}:`, error);
        return {
          success: false,
          message: 'Erreur lors de la récupération du trajet',
          trajet: null
        };
      }
    },
    
    // Récupérer les trajets créés par l'utilisateur connecté
    mesTrajets: async (_, __, context) => {
      try {
        const user = await checkAuth(context);
        const result = await trajetClient.getTrajetsByUser(user.id, false);
        return result;
      } catch (error) {
        console.error('Erreur lors de la récupération de mes trajets:', error);
        return {
          success: false,
          message: error.message,
          trajets: []
        };
      }
    },
    
    // Récupérer les trajets réservés par l'utilisateur connecté
    mesReservations: async (_, __, context) => {
      try {
        const user = await checkAuth(context);
        const result = await trajetClient.getTrajetsByUser(user.id, true);
        return result;
      } catch (error) {
        console.error('Erreur lors de la récupération de mes réservations:', error);
        return {
          success: false,
          message: error.message,
          trajets: []
        };
      }
    }
  },
  
  Mutation: {
    // Créer un nouveau trajet
    createTrajet: async (_, { input }, context) => {
      try {
        const user = await checkAuth(context);
        
        // Vérifier que l'utilisateur est un conducteur
        if (user.role !== 'conducteur') {
          return {
            success: false,
            message: 'Seuls les conducteurs peuvent créer des trajets',
            trajet: null
          };
        }
        
        const trajetData = {
          ...input,
          conducteurId: user.id,
          conducteurNom: user.username
        };
        
        const result = await trajetClient.createTrajet(trajetData);
        return result;
      } catch (error) {
        console.error('Erreur lors de la création du trajet:', error);
        return {
          success: false,
          message: error.message,
          trajet: null
        };
      }
    },
    
    // Mettre à jour un trajet
    updateTrajet: async (_, { id, input }, context) => {
      try {
        const user = await checkAuth(context);
        
        // Récupérer le trajet pour vérifier que l'utilisateur est le propriétaire
        const trajetInfo = await trajetClient.getTrajetById(id);
        
        if (!trajetInfo.success) {
          return trajetInfo;
        }
        
        if (trajetInfo.trajet.conducteurId !== user.id) {
          return {
            success: false,
            message: 'Vous ne pouvez modifier que vos propres trajets',
            trajet: null
          };
        }
        
        const result = await trajetClient.updateTrajet(id, input);
        return result;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du trajet ${id}:`, error);
        return {
          success: false,
          message: error.message,
          trajet: null
        };
      }
    },
    
    // Supprimer un trajet
    deleteTrajet: async (_, { id }, context) => {
      try {
        const user = await checkAuth(context);
        
        // Récupérer le trajet pour vérifier que l'utilisateur est le propriétaire
        const trajetInfo = await trajetClient.getTrajetById(id);
        
        if (!trajetInfo.success) {
          return {
            success: false,
            message: 'Trajet non trouvé'
          };
        }
        
        if (trajetInfo.trajet.conducteurId !== user.id) {
          return {
            success: false,
            message: 'Vous ne pouvez supprimer que vos propres trajets'
          };
        }
        
        const result = await trajetClient.deleteTrajet(id);
        return result;
      } catch (error) {
        console.error(`Erreur lors de la suppression du trajet ${id}:`, error);
        return {
          success: false,
          message: error.message
        };
      }
    },
    
    // Réserver une place dans un trajet
    bookTrajet: async (_, { input }, context) => {
      try {
        const user = await checkAuth(context);
        
        const bookingData = {
          trajetId: input.trajetId,
          passagerId: user.id,
          passagerNom: user.username,
          places: input.places
        };
        
        const result = await trajetClient.bookTrajet(bookingData);
        return result;
      } catch (error) {
        console.error(`Erreur lors de la réservation du trajet:`, error);
        return {
          success: false,
          message: error.message,
          reservation: null,
          trajet: null
        };
      }
    },
    
    // Annuler une réservation
    cancelBooking: async (_, { input }, context) => {
      try {
        const user = await checkAuth(context);
        
        const cancelData = {
          trajetId: input.trajetId,
          reservationId: input.reservationId,
          passagerId: user.id
        };
        
        const result = await trajetClient.cancelBooking(cancelData);
        return result;
      } catch (error) {
        console.error(`Erreur lors de l'annulation de la réservation:`, error);
        return {
          success: false,
          message: error.message
        };
      }
    }
  }
};

module.exports = trajetResolvers;