const logger = require('../utils/logger');
const { TOPICS } = require('../utils/kafka');

/**
 * Traitement des messages du topic des événements de réservation
 * @param {Object} message - Message Kafka
 */
function processReservationMessage(message) {
  try {
    const data = JSON.parse(message.value.toString());
    const { eventType, timestamp } = data;
    
    switch (eventType) {
      case 'RESERVATION_CREATED':
        const { reservation, tripId, passengerId } = data;
        logger.info(`[RESERVATION_CREATED] Nouvelle réservation: ID=${reservation.id}, Trajet=${tripId}, Passager=${passengerId}, Places=${reservation.places}`);
        break;
        
      case 'RESERVATION_CANCELED':
        const { reservationId, tripId: cancelledTripId, passengerId: cancellingPassenger } = data;
        logger.info(`[RESERVATION_CANCELED] Réservation annulée: ID=${reservationId}, Trajet=${cancelledTripId}, Passager=${cancellingPassenger}`);
        break;
        
      default:
        logger.warn(`Type d'événement réservation inconnu: ${eventType}`);
    }
  } catch (error) {
    logger.error(`Erreur lors du traitement du message réservation: ${error.message}`, { 
      messageValue: message.value?.toString(),
      error
    });
  }
}

/**
 * Enregistrement du handler pour les événements de réservation
 * @param {Object} consumer - Instance du consommateur Kafka
 */
function registerReservationHandler(consumer) {
  logger.info(`Enregistrement du handler pour le topic ${TOPICS.RESERVATION_EVENTS}`);
  return {
    topic: TOPICS.RESERVATION_EVENTS,
    processor: processReservationMessage
  };
}

module.exports = {
  processReservationMessage,
  registerReservationHandler
};