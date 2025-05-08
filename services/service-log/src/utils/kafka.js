const { Kafka } = require('kafkajs');
const logger = require('./logger');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'service-log',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Définition des topics
const TOPICS = {
  TRIP_EVENTS: 'trip-events',
  RESERVATION_EVENTS: 'reservation-events',
  LOG_EVENTS: 'log-events'
};

// Création du consommateur
const consumer = kafka.consumer({ 
  groupId: 'covoiturage-log-service',
  sessionTimeout: 30000
});

// Connexion du consommateur
async function connectConsumer() {
  try {
    await consumer.connect();
    logger.info('Kafka Consumer connected successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to connect Kafka consumer: ${error.message}`);
    return false;
  }
}

// S'abonner aux topics
async function subscribeToTopics() {
  try {
    await consumer.subscribe({ 
      topics: Object.values(TOPICS),
      fromBeginning: true
    });
    logger.info(`Subscribed to topics: ${Object.values(TOPICS).join(', ')}`);
    return true;
  } catch (error) {
    logger.error(`Failed to subscribe to topics: ${error.message}`);
    return false;
  }
}

// Gestion des erreurs du consommateur
async function registerConsumerErrorHandler() {
  consumer.on(consumer.events.CRASH, ({ payload: { error } }) => {
    logger.error(`Consumer crashed: ${error.message}`, { stack: error.stack });
  });

  consumer.on(consumer.events.DISCONNECT, () => {
    logger.warn(`Consumer disconnected`);
  });

  consumer.on(consumer.events.CONNECT, () => {
    logger.info(`Consumer reconnected`);
  });
}

// Vérification que les topics existent
async function checkTopicsExist() {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    
    const missingTopics = Object.values(TOPICS).filter(topic => !topics.includes(topic));
    
    if (missingTopics.length > 0) {
      logger.warn(`Missing Kafka topics: ${missingTopics.join(', ')}`);
    } else {
      logger.info('All required Kafka topics exist');
    }
    
    await admin.disconnect();
  } catch (error) {
    logger.error(`Failed to check topics existence: ${error.message}`);
  }
}

module.exports = {
  kafka,
  consumer,
  TOPICS,
  connectConsumer,
  subscribeToTopics,
  registerConsumerErrorHandler,
  checkTopicsExist
};