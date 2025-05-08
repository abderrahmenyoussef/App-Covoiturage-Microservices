const winston = require('winston');
const path = require('path');

// Configuration des formats
const formats = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
  winston.format.printf(info => {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
  })
);

// Configuration de Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: formats,
  defaultMeta: { service: 'service-log' },
  transports: [
    // Console logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Fichier pour tous les logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log')
    }),
    // Fichier séparé pour les erreurs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    })
  ]
});

// Création du répertoire logs s'il n'existe pas
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

module.exports = logger;