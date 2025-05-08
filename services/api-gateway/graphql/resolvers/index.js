const authResolvers = require('./authResolvers');
const trajetResolvers = require('./trajetResolvers');

// Combiner tous les résolveurs
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...trajetResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...trajetResolvers.Mutation
  }
};

module.exports = resolvers;