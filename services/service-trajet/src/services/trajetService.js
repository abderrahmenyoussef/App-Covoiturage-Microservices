const { Trajet } = require('../database/mongodb');
const { v4: uuidv4 } = require('uuid');
const iaClient = require('./iaClient');

/**
 * Service de gestion des trajets
 */
const trajetService = {
  /**
   * Créer un nouveau trajet
   */
  async createTrajet(trajetData) {
    try {
      // Si le prix n'est pas fourni, utiliser le service IA pour le prédire
      let prix = trajetData.prix;
      if (prix === undefined || prix === null) {
        try {
          const prediction = await iaClient.predictPrice(
            trajetData.placesDisponibles, 
            trajetData.depart, 
            trajetData.destination
          );
          
          if (prediction && prediction.success) {
            prix = prediction.prixEstime;
            console.log(`Prix prédit par l'IA: ${prix} dinars`);
          } else {
            // Prix par défaut si la prédiction échoue
            prix = 15.00;
            console.log(`Échec de la prédiction IA, prix par défaut utilisé: ${prix} dinars`);
          }
        } catch (predictionError) {
          // En cas d'erreur avec le service IA, utiliser un prix par défaut
          prix = 15.00;
          console.error('Erreur lors de la prédiction du prix:', predictionError);
          console.log(`Prix par défaut utilisé: ${prix} dinars`);
        }
      }

      const newTrajet = new Trajet({
        depart: trajetData.depart,
        destination: trajetData.destination,
        conducteurId: trajetData.conducteurId,
        conducteurNom: trajetData.conducteurNom || `Conducteur ${trajetData.conducteurId}`,
        dateDepart: new Date(trajetData.dateDepart),
        placesDisponibles: trajetData.placesDisponibles,
        prix: prix,
        description: trajetData.description
      });

      const savedTrajet = await newTrajet.save();
      
      return {
        success: true,
        message: 'Trajet créé avec succès',
        trajet: formatTrajet(savedTrajet)
      };
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error);
      return {
        success: false,
        message: 'Erreur lors de la création du trajet',
        trajet: null
      };
    }
  },

  /**
   * Récupérer tous les trajets avec filtres optionnels
   */
  async getAllTrajets(filters = {}) {
    try {
      // Construire les critères de filtrage
      const query = {};

      if (filters.depart) {
        query.depart = { $regex: new RegExp(filters.depart, 'i') };
      }

      if (filters.destination) {
        query.destination = { $regex: new RegExp(filters.destination, 'i') };
      }

      if (filters.dateDepart) {
        const date = new Date(filters.dateDepart);
        // Rechercher les trajets du même jour
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.dateDepart = { $gte: startOfDay, $lte: endOfDay };
      }

      if (filters.placesMinimum) {
        // Rechercher les trajets avec au moins X places disponibles
        query.placesDisponibles = { $gte: filters.placesMinimum };
      }

      if (filters.prixMax) {
        query.prix = { $lte: filters.prixMax };
      }

      // Rechercher uniquement les trajets futurs
      query.dateDepart = { ...(query.dateDepart || {}), $gte: new Date() };
      
      // Récupérer les trajets
      const trajets = await Trajet.find(query).sort({ dateDepart: 1 });

      return {
        success: true,
        message: 'Trajets récupérés avec succès',
        trajets: trajets.map(formatTrajet)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des trajets:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des trajets',
        trajets: []
      };
    }
  },

  /**
   * Récupérer un trajet par son ID
   */
  async getTrajetById(id) {
    try {
      const trajet = await Trajet.findById(id);
      
      if (!trajet) {
        return {
          success: false,
          message: 'Trajet non trouvé',
          trajet: null
        };
      }

      return {
        success: true,
        message: 'Trajet récupéré avec succès',
        trajet: formatTrajet(trajet)
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du trajet ${id}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du trajet',
        trajet: null
      };
    }
  },

  /**
   * Récupérer les trajets d'un utilisateur
   */
  async getTrajetsByUser(userId, asPassenger = false) {
    try {
      let trajets;
      
      if (asPassenger) {
        // Récupérer les trajets où l'utilisateur est passager (a fait une réservation)
        trajets = await Trajet.find({
          'reservations.passagerId': userId
        }).sort({ dateDepart: 1 });
      } else {
        // Récupérer les trajets créés par l'utilisateur (conducteur)
        trajets = await Trajet.find({
          conducteurId: userId
        }).sort({ dateDepart: 1 });
      }

      return {
        success: true,
        message: 'Trajets récupérés avec succès',
        trajets: trajets.map(formatTrajet)
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des trajets pour l'utilisateur ${userId}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des trajets',
        trajets: []
      };
    }
  },

  /**
   * Mettre à jour un trajet
   */
  async updateTrajet(id, updateData) {
    try {
      const trajet = await Trajet.findById(id);
      
      if (!trajet) {
        return {
          success: false,
          message: 'Trajet non trouvé',
          trajet: null
        };
      }

      // Vérifier que le trajet n'a pas déjà des réservations
      if (trajet.reservations.length > 0 && 
          (updateData.placesDisponibles !== undefined || 
           updateData.dateDepart !== undefined)) {
        return {
          success: false,
          message: 'Impossible de modifier le nombre de places ou la date d\'un trajet avec des réservations',
          trajet: formatTrajet(trajet)
        };
      }

      // Mettre à jour les champs
      if (updateData.depart !== undefined) trajet.depart = updateData.depart;
      if (updateData.destination !== undefined) trajet.destination = updateData.destination;
      if (updateData.dateDepart !== undefined) trajet.dateDepart = new Date(updateData.dateDepart);
      if (updateData.placesDisponibles !== undefined) trajet.placesDisponibles = updateData.placesDisponibles;
      if (updateData.prix !== undefined) trajet.prix = updateData.prix;
      if (updateData.description !== undefined) trajet.description = updateData.description;

      const updatedTrajet = await trajet.save();
      
      return {
        success: true,
        message: 'Trajet mis à jour avec succès',
        trajet: formatTrajet(updatedTrajet)
      };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du trajet ${id}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du trajet',
        trajet: null
      };
    }
  },

  /**
   * Supprimer un trajet
   */
  async deleteTrajet(id) {
    try {
      const trajet = await Trajet.findById(id);
      
      if (!trajet) {
        return {
          success: false,
          message: 'Trajet non trouvé'
        };
      }

      // Vérifier que le trajet n'a pas de réservations
      if (trajet.reservations.length > 0) {
        return {
          success: false,
          message: 'Impossible de supprimer un trajet avec des réservations'
        };
      }

      await Trajet.findByIdAndDelete(id);
      
      return {
        success: true,
        message: 'Trajet supprimé avec succès'
      };
    } catch (error) {
      console.error(`Erreur lors de la suppression du trajet ${id}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la suppression du trajet'
      };
    }
  },

  /**
   * Réserver une place dans un trajet
   */
  async bookTrajet(trajetId, bookingData) {
    try {
      const trajet = await Trajet.findById(trajetId);
      
      if (!trajet) {
        return {
          success: false,
          message: 'Trajet non trouvé',
          reservation: null,
          trajet: null
        };
      }

      // Vérifier qu'il y a assez de places disponibles
      if (trajet.placesDisponibles < bookingData.places) {
        return {
          success: false,
          message: `Il n'y a que ${trajet.placesDisponibles} places disponibles`,
          reservation: null,
          trajet: formatTrajet(trajet)
        };
      }

      // Vérifier que l'utilisateur ne réserve pas son propre trajet
      if (trajet.conducteurId === bookingData.passagerId) {
        return {
          success: false,
          message: 'Vous ne pouvez pas réserver votre propre trajet',
          reservation: null,
          trajet: formatTrajet(trajet)
        };
      }

      // Vérifier si l'utilisateur a déjà réservé ce trajet
      const existingReservation = trajet.reservations.find(
        r => r.passagerId === bookingData.passagerId
      );

      if (existingReservation) {
        return {
          success: false,
          message: 'Vous avez déjà réservé ce trajet',
          reservation: {
            id: existingReservation._id.toString(),
            passagerId: existingReservation.passagerId,
            passagerNom: existingReservation.passagerNom,
            places: existingReservation.places,
            dateReservation: existingReservation.dateReservation.toISOString()
          },
          trajet: formatTrajet(trajet)
        };
      }

      // Créer la nouvelle réservation
      const reservation = {
        _id: uuidv4(),
        passagerId: bookingData.passagerId,
        passagerNom: bookingData.passagerNom,
        places: bookingData.places,
        dateReservation: new Date()
      };

      // Ajouter la réservation au trajet
      trajet.reservations.push(reservation);
      trajet.placesReservees += reservation.places;
      trajet.placesDisponibles -= reservation.places;

      const updatedTrajet = await trajet.save();
      
      return {
        success: true,
        message: 'Réservation effectuée avec succès',
        reservation: {
          id: reservation._id,
          passagerId: reservation.passagerId,
          passagerNom: reservation.passagerNom,
          places: reservation.places,
          dateReservation: reservation.dateReservation.toISOString()
        },
        trajet: formatTrajet(updatedTrajet)
      };
    } catch (error) {
      console.error(`Erreur lors de la réservation du trajet ${trajetId}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la réservation du trajet',
        reservation: null,
        trajet: null
      };
    }
  },

  /**
   * Annuler une réservation
   */
  async cancelBooking(trajetId, reservationId, passagerId) {
    try {
      const trajet = await Trajet.findById(trajetId);
      
      if (!trajet) {
        return {
          success: false,
          message: 'Trajet non trouvé'
        };
      }

      // Trouver la réservation en comparant les chaînes de caractères des IDs
      const reservationIndex = trajet.reservations.findIndex(
        r => r._id === reservationId && r.passagerId === parseInt(passagerId)
      );

      if (reservationIndex === -1) {
        return {
          success: false,
          message: 'Réservation non trouvée'
        };
      }

      const places = trajet.reservations[reservationIndex].places;

      // Supprimer la réservation et mettre à jour les places
      trajet.reservations.splice(reservationIndex, 1);
      trajet.placesReservees -= places;
      trajet.placesDisponibles += places;

      await trajet.save();
      
      return {
        success: true,
        message: 'Réservation annulée avec succès'
      };
    } catch (error) {
      console.error(`Erreur lors de l'annulation de la réservation ${reservationId}:`, error);
      return {
        success: false,
        message: 'Erreur lors de l\'annulation de la réservation'
      };
    }
  }
};

/**
 * Formater un trajet pour la réponse API
 */
function formatTrajet(trajet) {
  return {
    id: trajet._id.toString(),
    depart: trajet.depart,
    destination: trajet.destination,
    conducteurId: trajet.conducteurId,
    conducteurNom: trajet.conducteurNom,
    dateDepart: trajet.dateDepart.toISOString(),
    placesDisponibles: trajet.placesDisponibles,
    placesReservees: trajet.placesReservees,
    prix: trajet.prix,
    description: trajet.description,
    dateCreation: trajet.dateCreation.toISOString(),
    reservations: trajet.reservations.map(res => ({
      id: res._id.toString(),
      passagerId: res.passagerId,
      passagerNom: res.passagerNom,
      places: res.places,
      dateReservation: res.dateReservation.toISOString()
    }))
  };
}

module.exports = trajetService;