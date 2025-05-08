const iaTypes = `
  # Réponse de prédiction de prix
  type PricePredictionResponse {
    success: Boolean!
    message: String!
    prixEstime: Float!
  }

  # Entrée pour la prédiction de prix
  input PricePredictionInput {
    placesDisponibles: Int!
    depart: String
    destination: String
  }

  # Extensions des types existants
  extend type Query {
    # Prédire le prix d'un trajet
    predictPrice(input: PricePredictionInput!): PricePredictionResponse!
  }
`;

module.exports = iaTypes;