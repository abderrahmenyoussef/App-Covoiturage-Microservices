const logger = require('../utils/logger');
const { TOPICS } = require('../utils/kafka');

/**
 * Traitement des messages du topic des événements généraux
 * @param {Object} message - Message Kafka
 */
function processLogMessage(message) {
  try {
    const data = JSON.parse(message.value.toString());
    const { eventType, timestamp } = data;
    
    // Log général qui capture tous les types d'événements
    logger.info(`[${eventType}] ${JSON.stringify(data)}`, { 
      eventType,
      timestamp,
      data
    });
  } catch (error) {
    logger.error(`Erreur lors du traitement du message log: ${error.message}`, {
      messageValue: message.value?.toString(),
      error
    });
  }
}

/**
 * Enregistrement du handler pour les événements généraux
 * @param {Object} consumer - Instance du consommateur Kafka
 */
function registerLogHandler(consumer) {
  logger.info(`Enregistrement du handler pour le topic ${TOPICS.LOG_EVENTS}`);
  return {
    topic: TOPICS.LOG_EVENTS,
    processor: processLogMessage
  };
}

module.exports = {
  processLogMessage,
  registerLogHandler
};