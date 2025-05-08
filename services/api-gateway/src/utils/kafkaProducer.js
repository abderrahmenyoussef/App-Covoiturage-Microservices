const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['localhost:9092']
});

// Create producer
const producer = kafka.producer();

// Connect on startup
let connected = false;
async function connectProducer() {
  if (!connected) {
    try {
      await producer.connect();
      connected = true;
      console.log('Kafka Producer connected successfully');
    } catch (error) {
      console.error('Error connecting to Kafka:', error);
    }
  }
}

// Topic names
const TOPICS = {
  TRIP_EVENTS: 'trip-events',
  RESERVATION_EVENTS: 'reservation-events',
  LOG_EVENTS: 'log-events'
};

/**
 * Send message to Kafka topic
 * @param {string} topic - Kafka topic name
 * @param {object} message - Message payload
 * @param {string} key - Optional message key for partitioning
 * @returns {Promise} - Promise of send operation
 */
async function sendMessage(topic, message, key = null) {
  if (!connected) {
    await connectProducer();
  }

  try {
    const messagePayload = {
      topic,
      messages: [
        {
          value: JSON.stringify(message),
          ...(key && { key })
        }
      ]
    };

    await producer.send(messagePayload);
    console.log(`Message sent to ${topic}:`, message);
    return { success: true };
  } catch (error) {
    console.error(`Error sending message to ${topic}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Log trip creation event
 * @param {object} trip - Trip data
 * @param {string} userId - User ID who created the trip
 */
async function logTripCreation(trip, userId) {
  return sendMessage(TOPICS.TRIP_EVENTS, {
    eventType: 'TRIP_CREATED',
    timestamp: new Date().toISOString(),
    trip,
    userId
  }, trip.id || userId);
}

/**
 * Log trip update event
 * @param {string} tripId - Trip ID
 * @param {object} updateData - Updated trip data
 * @param {string} userId - User ID who updated the trip
 */
async function logTripUpdate(tripId, updateData, userId) {
  return sendMessage(TOPICS.TRIP_EVENTS, {
    eventType: 'TRIP_UPDATED',
    timestamp: new Date().toISOString(),
    tripId,
    updateData,
    userId
  }, tripId);
}

/**
 * Log trip deletion event
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID who deleted the trip
 */
async function logTripDeletion(tripId, userId) {
  return sendMessage(TOPICS.TRIP_EVENTS, {
    eventType: 'TRIP_DELETED',
    timestamp: new Date().toISOString(),
    tripId,
    userId
  }, tripId);
}

/**
 * Log reservation event
 * @param {object} reservation - Reservation data
 * @param {string} tripId - Trip ID
 * @param {string} passengerId - Passenger ID
 */
async function logReservation(reservation, tripId, passengerId) {
  return sendMessage(TOPICS.RESERVATION_EVENTS, {
    eventType: 'RESERVATION_CREATED',
    timestamp: new Date().toISOString(),
    reservation,
    tripId,
    passengerId
  }, reservation.id || tripId);
}

/**
 * Log reservation cancellation event
 * @param {string} reservationId - Reservation ID
 * @param {string} tripId - Trip ID
 * @param {string} passengerId - Passenger ID who canceled
 */
async function logReservationCancellation(reservationId, tripId, passengerId) {
  return sendMessage(TOPICS.RESERVATION_EVENTS, {
    eventType: 'RESERVATION_CANCELED',
    timestamp: new Date().toISOString(),
    reservationId,
    tripId,
    passengerId
  }, reservationId);
}

// General purpose logging function
async function logEvent(eventType, data) {
  return sendMessage(TOPICS.LOG_EVENTS, {
    eventType,
    timestamp: new Date().toISOString(),
    ...data
  });
}

// Connect when the module is loaded
connectProducer();

module.exports = {
  producer,
  TOPICS,
  sendMessage,
  logTripCreation,
  logTripUpdate,
  logTripDeletion,
  logReservation,
  logReservationCancellation,
  logEvent,
  connectProducer
};