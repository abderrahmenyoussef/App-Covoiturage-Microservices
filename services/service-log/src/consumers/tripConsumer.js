const logger = require('../utils/logger');
const { TOPICS } = require('../utils/kafka');

/**
 * Traitement des messages du topic des événements de trajet
 * @param {Object} message - Message Kafka
 */
function processTripMessage(message) {
  try {
    const data = JSON.parse(message.value.toString());
    const { eventType, timestamp } = data;
    
    switch (eventType) {
      case 'TRIP_CREATED':
        const { trip, userId } = data;
        logger.info(`[TRIP_CREATED] Trajet créé: ID=${trip.id}, Conducteur=${userId}, Itinéraire=${trip.villeDepart}->${trip.villeArrivee}`);
        break;
        
      case 'TRIP_UPDATED':
        const { tripId, updateData, userId: updaterId } = data;
        logger.info(`[TRIP_UPDATED] Trajet modifié: ID=${tripId}, Utilisateur=${updaterId}, Modifications=${JSON.stringify(updateData)}`);
        break;
        
      case 'TRIP_DELETED':
        const { tripId: deletedTripId, userId: deleterId } = data;
        logger.info(`[TRIP_DELETED] Trajet supprimé: ID=${deletedTripId}, Utilisateur=${deleterId}`);
        break;
        
      default:
        logger.warn(`Type d'événement trajet inconnu: ${eventType}`);
    }
  } catch (error) {
    logger.error(`Erreur lors du traitement du message trajet: ${error.message}`, { 
      messageValue: message.value?.toString(),
      error
    });
  }
}

/**
 * Enregistrement du handler pour les événements de trajet
 * @param {Object} consumer - Instance du consommateur Kafka
 */
function registerTripHandler(consumer) {
  logger.info(`Enregistrement du handler pour le topic ${TOPICS.TRIP_EVENTS}`);
  return {
    topic: TOPICS.TRIP_EVENTS,
    processor: processTripMessage
  };
}

module.exports = {
  processTripMessage,
  registerTripHandler
};