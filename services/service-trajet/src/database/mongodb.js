const mongoose = require('mongoose');
const config = require('../config');

// Schéma pour les réservations
const ReservationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  passagerId: { type: Number, required: true },
  passagerNom: { type: String, required: true },
  places: { type: Number, required: true, min: 1 },
  dateReservation: { type: Date, default: Date.now }
});

// Schéma pour les trajets
const TrajetSchema = new mongoose.Schema({
  depart: { type: String, required: true },
  destination: { type: String, required: true },
  conducteurId: { type: Number, required: true },
  conducteurNom: { type: String },
  dateDepart: { type: Date, required: true },
  placesDisponibles: { type: Number, required: true, min: 1 },
  placesReservees: { type: Number, default: 0 },
  prix: { type: Number, required: true },
  description: { type: String },
  dateCreation: { type: Date, default: Date.now },
  reservations: [ReservationSchema]
});

// Création des modèles
const Trajet = mongoose.model('Trajet', TrajetSchema);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connecté avec succès');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  Trajet
};