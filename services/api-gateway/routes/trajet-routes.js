const express = require('express');
const trajetClient = require('../src/clients/trajet-client');
const { verifyToken } = require('../src/clients/auth-client');
const kafkaProducer = require('../src/utils/kafkaProducer');
const router = express.Router();

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentification requise' 
    });
  }

  try {
    const result = await verifyToken({ token });
    
    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }
    
    // Stocker les informations utilisateur dans la demande
    req.user = result.user;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'authentification' 
    });
  }
};

// ROUTES PUBLIQUES

// Récupérer tous les trajets avec filtres optionnels
router.get('/trajets', async (req, res) => {
  try {
    // Récupérer les filtres de la requête
    const filters = {
      depart: req.query.depart,
      destination: req.query.destination,
      dateDepart: req.query.dateDepart,
      placesMinimum: req.query.placesMinimum ? parseInt(req.query.placesMinimum) : undefined,
      prixMax: req.query.prixMax ? parseFloat(req.query.prixMax) : undefined
    };
    
    const result = await trajetClient.getAllTrajets(filters);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des trajets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trajets',
      trajets: []
    });
  }
});

// Récupérer un trajet par son ID
router.get('/trajets/:id', async (req, res) => {
  try {
    const result = await trajetClient.getTrajetById(req.params.id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error(`Erreur lors de la récupération du trajet ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trajet',
      trajet: null
    });
  }
});

// ROUTES AUTHENTIFIÉES

// Récupérer les trajets créés par l'utilisateur connecté
router.get('/mes-trajets', authenticate, async (req, res) => {
  try {
    const result = await trajetClient.getTrajetsByUser(req.user.id, false);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération de mes trajets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos trajets',
      trajets: []
    });
  }
});

// Récupérer les trajets réservés par l'utilisateur connecté
router.get('/mes-reservations', authenticate, async (req, res) => {
  try {
    const result = await trajetClient.getTrajetsByUser(req.user.id, true);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération de mes réservations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos réservations',
      trajets: []
    });
  }
});

// Créer un nouveau trajet
router.post('/trajets', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un conducteur
    if (req.user.role !== 'conducteur') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les conducteurs peuvent créer des trajets',
        trajet: null
      });
    }

    const trajetData = {
      ...req.body,
      conducteurId: req.user.id,
      conducteurNom: req.user.username
    };
    
    const result = await trajetClient.createTrajet(trajetData);
    
    // Send Kafka message for trip creation
    if (result.success) {
      await kafkaProducer.logTripCreation(result.trajet, req.user.id);
      console.log('Message Kafka envoyé: création de trajet', result.trajet.id);
    }
    
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Erreur lors de la création du trajet:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du trajet',
      trajet: null
    });
  }
});

// Mettre à jour un trajet
router.put('/trajets/:id', authenticate, async (req, res) => {
  try {
    // Récupérer le trajet pour vérifier que l'utilisateur est le propriétaire
    const trajetInfo = await trajetClient.getTrajetById(req.params.id);
    
    if (!trajetInfo.success) {
      return res.status(404).json(trajetInfo);
    }
    
    if (trajetInfo.trajet.conducteurId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres trajets',
        trajet: null
      });
    }
    
    const result = await trajetClient.updateTrajet(req.params.id, req.body);
    
    // Send Kafka message for trip update
    if (result.success) {
      await kafkaProducer.logTripUpdate(req.params.id, req.body, req.user.id);
      console.log('Message Kafka envoyé: mise à jour de trajet', req.params.id);
    }
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du trajet ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du trajet',
      trajet: null
    });
  }
});

// Supprimer un trajet
router.delete('/trajets/:id', authenticate, async (req, res) => {
  try {
    // Récupérer le trajet pour vérifier que l'utilisateur est le propriétaire
    const trajetInfo = await trajetClient.getTrajetById(req.params.id);
    
    if (!trajetInfo.success) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé'
      });
    }
    
    if (trajetInfo.trajet.conducteurId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres trajets'
      });
    }
    
    const result = await trajetClient.deleteTrajet(req.params.id);
    
    // Send Kafka message for trip deletion
    if (result.success) {
      await kafkaProducer.logTripDeletion(req.params.id, req.user.id);
      console.log('Message Kafka envoyé: suppression de trajet', req.params.id);
    }
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(`Erreur lors de la suppression du trajet ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du trajet'
    });
  }
});

// Réserver une place dans un trajet
router.post('/trajets/:id/reservations', authenticate, async (req, res) => {
  try {
    console.log('Données reçues pour la réservation:', req.body);
    
    // Vérifier et convertir le nombre de places en nombre entier valide
    // Utiliser Number() pour la conversion puis Math.floor pour garantir un entier
    let places = Number(req.body.places);
    
    // Vérifier que places est un nombre valide et positif
    if (isNaN(places) || places <= 0) {
      console.error('Nombre de places invalide:', req.body.places, typeof req.body.places);
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places demandé est invalide ou manquant',
        reservation: null,
        trajet: null
      });
    }
    
    // Ensure places is an integer
    places = Math.floor(places);
    
    const bookingData = {
      trajetId: req.params.id,
      passagerId: req.user.id,
      passagerNom: req.user.username,
      places: places // Utiliser la valeur convertie en entier
    };
    
    console.log('Données de réservation formatées:', bookingData);
    
    const result = await trajetClient.bookTrajet(bookingData);
    
    // Send Kafka message for reservation creation
    if (result.success) {
      await kafkaProducer.logReservation(
        result.reservation,
        req.params.id,
        req.user.id
      );
      console.log('Message Kafka envoyé: nouvelle réservation', result.reservation.id);
    }
    
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error(`Erreur lors de la réservation du trajet ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la réservation du trajet',
      reservation: null,
      trajet: null
    });
  }
});

// Annuler une réservation
router.delete('/trajets/:trajetId/reservations/:reservationId', authenticate, async (req, res) => {
  try {
    const cancelData = {
      trajetId: req.params.trajetId,
      reservationId: req.params.reservationId,
      passagerId: req.user.id
    };
    
    const result = await trajetClient.cancelBooking(cancelData);
    
    // Send Kafka message for reservation cancellation
    if (result.success) {
      await kafkaProducer.logReservationCancellation(
        req.params.reservationId,
        req.params.trajetId,
        req.user.id
      );
      console.log('Message Kafka envoyé: annulation de réservation', req.params.reservationId);
    }
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(`Erreur lors de l'annulation de la réservation:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la réservation'
    });
  }
});

module.exports = router;