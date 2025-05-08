const express = require('express');
const router = express.Router();
const iaClient = require('../src/clients/ia-client');

/**
 * @route   POST /api/ia/predict-price
 * @desc    Prédire le prix d'un trajet en fonction du nombre de places disponibles
 * @access  Public
 */
router.post('/predict-price', async (req, res) => {
  try {
    const { placesDisponibles, depart, destination } = req.body;
    
    if (!placesDisponibles || placesDisponibles < 1 || placesDisponibles > 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places disponibles doit être entre 1 et 6',
        prixEstime: 0
      });
    }
    
    const predictionResponse = await iaClient.predictPrice({
      placesDisponibles,
      depart: depart || '',
      destination: destination || ''
    });
    
    return res.json(predictionResponse);
  } catch (error) {
    console.error('Erreur lors de la prédiction de prix:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la prédiction de prix',
      prixEstime: 0
    });
  }
});

/**
 * @route   GET /api/ia/health
 * @desc    Vérifier l'état du service IA
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Une prédiction simple pour vérifier que le service IA est en ligne
    const response = await iaClient.predictPrice({
      placesDisponibles: 3,
      depart: '',
      destination: ''
    });
    
    if (response && response.success) {
      return res.json({
        status: 'ok',
        message: 'Le service IA est opérationnel'
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'Le service IA est en ligne mais rencontre des problèmes'
      });
    }
  } catch (error) {
    console.error('Erreur de connexion au service IA:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Le service IA est indisponible'
    });
  }
});

module.exports = router;