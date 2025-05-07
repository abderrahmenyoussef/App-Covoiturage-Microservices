const Database = require('better-sqlite3');
const config = require('../config');
const path = require('path');
const fs = require('fs');

// Assurez-vous que le répertoire existe
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connexion à la base de données SQLite
const db = new Database(config.dbPath);

// Initialisation de la base de données
function initDatabase() {
  // Création de la table utilisateurs si elle n'existe pas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('conducteur', 'passager')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Création de la table des tokens si nécessaire pour la persistance
  db.exec(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      expiry TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajout d'une migration pour les utilisateurs existants (attribuer un rôle par défaut)
  try {
    const existingUsers = db.prepare('SELECT id FROM users WHERE role IS NULL').all();
    if (existingUsers.length > 0) {
      const update = db.prepare('UPDATE users SET role = ? WHERE id = ?');
      existingUsers.forEach(user => {
        update.run('passager', user.id); // Rôle par défaut
      });
      console.log(`${existingUsers.length} utilisateurs mis à jour avec un rôle par défaut`);
    }
  } catch (error) {
    // La colonne role n'existe peut-être pas encore
    console.log('Migration des utilisateurs existants ignorée');
  }

  console.log('Base de données SQLite initialisée avec succès');
}

module.exports = {
  db,
  initDatabase
};