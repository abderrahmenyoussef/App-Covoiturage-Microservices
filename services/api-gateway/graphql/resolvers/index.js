const authResolvers = require('./authResolvers');
const trajetResolvers = require('./trajetResolvers');
const iaResolvers = require('./iaResolvers');

// Combiner tous les résolveurs
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...trajetResolvers.Query,
    ...iaResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...trajetResolvers.Mutation
  }
};

module.exports = resolvers;