const express = require('express');
const authClient = require('../src/clients/auth-client');

const router = express.Router();

// Middleware pour extraire le token JWT de l'en-tête d'autorisation
const extractToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.token = authHeader.substring(7);
  }
  next();
};

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis: username, email, password et role' 
      });
    }
    
    const response = await authClient.register({ username, email, password, role });
    
    if (!response.success) {
      return res.status(400).json(response);
    }
    
    return res.status(201).json(response);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }
    
    const response = await authClient.login({ email, password });
    
    if (!response.success) {
      return res.status(401).json(response);
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Route de vérification de token
router.get('/verify', extractToken, async (req, res) => {
  try {
    if (!req.token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token manquant' 
      });
    }
    
    const response = await authClient.verifyToken({ token: req.token });
    
    if (!response.success) {
      return res.status(401).json(response);
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Route de déconnexion
router.post('/logout', extractToken, async (req, res) => {
  try {
    if (!req.token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token manquant' 
      });
    }
    
    const response = await authClient.logout({ token: req.token });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

module.exports = router;