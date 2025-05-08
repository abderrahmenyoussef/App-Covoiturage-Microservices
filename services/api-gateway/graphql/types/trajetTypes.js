const trajetTypes = `
  # Type Reservation
  type Reservation {
    id: ID!
    passagerId: Int!
    passagerNom: String!
    places: Int!
    dateReservation: String!
  }

  # Type Trajet
  type Trajet {
    id: ID!
    depart: String!
    destination: String!
    conducteurId: Int!
    conducteurNom: String
    dateDepart: String!
    placesDisponibles: Int!
    placesReservees: Int!
    prix: Float!
    description: String
    dateCreation: String!
    reservations: [Reservation]
  }

  # Réponse pour un trajet
  type TrajetResponse {
    success: Boolean!
    message: String!
    trajet: Trajet
  }

  # Réponse pour plusieurs trajets
  type TrajetsResponse {
    success: Boolean!
    message: String!
    trajets: [Trajet]
  }

  # Réponse pour une réservation
  type BookingResponse {
    success: Boolean!
    message: String!
    reservation: Reservation
    trajet: Trajet
  }

  # Réponse pour une suppression
  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  # Entrée pour la création d'un trajet
  input TrajetInput {
    depart: String!
    destination: String!
    dateDepart: String!
    placesDisponibles: Int!
    prix: Float!
    description: String
  }

  # Entrée pour la mise à jour d'un trajet
  input UpdateTrajetInput {
    depart: String
    destination: String
    dateDepart: String
    placesDisponibles: Int
    prix: Float
    description: String
  }

  # Entrée pour la réservation d'un trajet
  input BookingInput {
    trajetId: ID!
    places: Int!
  }

  # Entrée pour l'annulation d'une réservation
  input CancelBookingInput {
    trajetId: ID!
    reservationId: ID!
  }

  # Entrée pour filtrer les trajets
  input TrajetFilters {
    depart: String
    destination: String
    dateDepart: String
    placesMinimum: Int
    prixMax: Float
  }

  # Extensions des types existants

  extend type Query {
    # Récupérer tous les trajets avec filtres optionnels
    trajets(filters: TrajetFilters): TrajetsResponse!
    
    # Récupérer un trajet par son ID
    trajet(id: ID!): TrajetResponse!
    
    # Récupérer les trajets créés par un utilisateur
    mesTrajets: TrajetsResponse!
    
    # Récupérer les trajets réservés par un utilisateur
    mesReservations: TrajetsResponse!
  }

  extend type Mutation {
    # Créer un nouveau trajet
    createTrajet(input: TrajetInput!): TrajetResponse!
    
    # Mettre à jour un trajet
    updateTrajet(id: ID!, input: UpdateTrajetInput!): TrajetResponse!
    
    # Supprimer un trajet
    deleteTrajet(id: ID!): DeleteResponse!
    
    # Réserver une place dans un trajet
    bookTrajet(input: BookingInput!): BookingResponse!
    
    # Annuler une réservation
    cancelBooking(input: CancelBookingInput!): DeleteResponse!
  }
`;

module.exports = trajetTypes;