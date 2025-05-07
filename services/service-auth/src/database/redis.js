const { createClient } = require('redis');
const config = require('../config');

// Créer un client Redis
const redisClient = createClient({
  url: config.redisUrl
});

// Gestionnaire d'erreurs de connexion
redisClient.on('error', (err) => {
  console.error('Erreur de connexion Redis:', err);
});

// Fonction pour initialiser la connexion
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Connexion à Redis établie avec succès');
  } catch (error) {
    console.error('Échec de connexion à Redis:', error);
    // On peut choisir de quitter le processus ou de continuer sans Redis
    // process.exit(1);
  }
}

// Fonctions utilitaires pour la gestion des tokens
async function saveToken(userId, token, expiry) {
  try {
    // On stocke le token dans Redis avec une durée de vie (TTL)
    const key = `token:${userId}:${token}`;
    await redisClient.set(key, 'active');
    await redisClient.expireAt(key, expiry);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du token:', error);
    return false;
  }
}

async function verifyToken(userId, token) {
  try {
    const key = `token:${userId}:${token}`;
    const result = await redisClient.get(key);
    return result === 'active';
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
}

async function revokeToken(userId, token) {
  try {
    const key = `token:${userId}:${token}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Erreur lors de la révocation du token:', error);
    return false;
  }
}

module.exports = {
  redisClient,
  connectRedis,
  saveToken,
  verifyToken,
  revokeToken
};