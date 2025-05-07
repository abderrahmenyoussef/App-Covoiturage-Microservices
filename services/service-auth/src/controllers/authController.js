const authService = require('../services/authService');
const Joi = require('joi');

// Schémas de validation
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('conducteur', 'passager').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Contrôleur pour l'authentification
class AuthController {
  // Inscription
  async register(req, res) {
    try {
      // Validation des données
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { username, email, password, role } = value;
      const result = await authService.register(username, email, password, role);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  // Connexion
  async login(req, res) {
    try {
      // Validation des données
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { email, password } = value;
      const result = await authService.login(email, password);
      
      if (!result.success) {
        return res.status(401).json(result);
      }
      
      return res.json(result);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  // Vérification de token
  async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Token manquant' });
      }
      
      const result = await authService.verifyUserToken(token);
      if (!result.success) {
        return res.status(401).json(result);
      }
      
      return res.json(result);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  // Déconnexion
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(400).json({ success: false, message: 'Token manquant' });
      }
      
      const result = await authService.logout(token);
      return res.json(result);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}

module.exports = new AuthController();