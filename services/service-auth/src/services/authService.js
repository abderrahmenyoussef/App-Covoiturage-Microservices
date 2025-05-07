const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../database/sqlite');
const redisService = require('../database/redis');

// Service d'authentification
class AuthService {
  // Enregistrer un nouvel utilisateur
  async register(username, email, password, role) {
    try {
      // Vérifier que le rôle est valide
      if (role !== 'conducteur' && role !== 'passager') {
        return { success: false, message: 'Le rôle doit être "conducteur" ou "passager"' };
      }
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existingUser) {
        if (existingUser.email === email) {
          return { success: false, message: 'Cet email est déjà utilisé' };
        }
        return { success: false, message: 'Ce nom d\'utilisateur est déjà pris' };
      }

      // Hacher le mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insérer le nouvel utilisateur
      const insert = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
      const result = insert.run(username, email, hashedPassword, role);

      return {
        success: true,
        userId: result.lastInsertRowid,
        role,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} enregistré avec succès`
      };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      return { success: false, message: 'Erreur lors de l\'enregistrement' };
    }
  }

  // Authentifier un utilisateur
  async login(email, password) {
    try {
      // Récupérer l'utilisateur
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      // Vérifier le mot de passe
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      // Générer un JWT token
      const token = this.generateToken(user);
      
      // Calculer l'expiration pour Redis
      const expiry = Math.floor(Date.now() / 1000) + 60 * 60; // 1 heure (dépend de config.jwtExpiration)
      
      // Sauvegarder le token dans Redis
      await redisService.saveToken(user.id, token, expiry);

      return {
        success: true,
        userId: user.id,
        username: user.username,
        role: user.role,
        token,
        message: 'Connexion réussie'
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, message: 'Erreur lors de la connexion' };
    }
  }

  // Vérifier un token
  async verifyUserToken(token) {
    try {
      // Vérifier le token JWT
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Vérifier si le token est dans Redis
      const isValid = await redisService.verifyToken(decoded.userId, token);
      if (!isValid) {
        return { success: false, message: 'Token invalide ou expiré' };
      }
      
      // Récupérer les informations utilisateur
      const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.userId);
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }
      
      return {
        success: true,
        user,
        message: 'Token valide'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return { success: false, message: 'Token invalide' };
    }
  }

  // Déconnexion (révocation de token)
  async logout(token) {
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Révoquer le token dans Redis
      await redisService.revokeToken(decoded.userId, token);
      
      return {
        success: true,
        message: 'Déconnexion réussie'
      };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, message: 'Erreur lors de la déconnexion' };
    }
  }

  // Générer un token JWT
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );
  }
}

module.exports = new AuthService();