const authResolvers = require('./authResolvers');

// Combiner tous les résolveurs
const resolvers = {
  Query: {
    ...authResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation
  }
};

module.exports = resolvers;