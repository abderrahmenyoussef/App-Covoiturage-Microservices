const dotenv = require('dotenv');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../database.sqlite')
};