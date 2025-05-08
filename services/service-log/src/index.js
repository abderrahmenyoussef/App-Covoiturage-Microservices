require('dotenv').config();
const logger = require('./utils/logger');
const { 
  consumer, 
  connectConsumer, 
  subscribeToTopics, 
  registerConsumerErrorHandler,
  checkTopicsExist 
} = require('./utils/kafka');

// Import des consommateurs par topic
const { registerTripHandler } = require('./consumers/tripConsumer');
const { registerReservationHandler } = require('./consumers/reservationConsumer');
const { registerLogHandler } = require('./consumers/logConsumer');

/**
 * Démarrage du service de log
 */
async function startLogService() {
  try {
    logger.info('Démarrage du service de log');
    
    // Vérification des topics Kafka
    await checkTopicsExist();
    
    // Connexion au consumer Kafka
    const connected = await connectConsumer();
    if (!connected) {
      throw new Error('Échec de connexion au consumer Kafka');
    }
    
    // Enregistrement des handlers d'erreurs
    await registerConsumerErrorHandler();
    
    // Abonnement aux topics
    await subscribeToTopics();
    
    // Récupération de tous les handlers par topic
    const handlers = [
      registerTripHandler(),
      registerReservationHandler(),
      registerLogHandler()
    ];
    
    // Démarrage du consumer et traitement des messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        logger.debug(`Message reçu - Topic: ${topic}, Partition: ${partition}`);
        
        // Trouver le bon handler pour ce topic
        const handler = handlers.find(h => h.topic === topic);
        if (handler) {
          handler.processor(message);
        } else {
          logger.warn(`Pas de handler trouvé pour le topic: ${topic}`);
        }
      }
    });
    
    logger.info('Service de log démarré avec succès');
    
    // Gestion de l'arrêt propre
    setupGracefulShutdown();
    
  } catch (error) {
    logger.error(`Erreur lors du démarrage du service de log: ${error.message}`, { error });
    process.exit(1);
  }
}

/**
 * Configuration de l'arrêt propre du service
 */
function setupGracefulShutdown() {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  async function shutdown() {
    logger.info('Arrêt du service de log...');
    try {
      await consumer.disconnect();
      logger.info('Déconnecté de Kafka');
      process.exit(0);
    } catch (error) {
      logger.error(`Erreur lors de la déconnexion de Kafka: ${error.message}`);
      process.exit(1);
    }
  }
}

// Démarrage du service
startLogService();