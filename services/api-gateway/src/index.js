const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('../graphql/schemas/schema');
const resolvers = require('../graphql/resolvers');
const authRoutes = require('../routes/auth-routes');

// Chargement des variables d'environnement
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Configuration Apollo Server (GraphQL)
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
      console.error('GraphQL error:', err);
      return {
        message: err.message,
        path: err.path
      };
    },
    context: ({ req }) => {
      // On peut ajouter des informations contextuelles ici
      const token = req.headers.authorization || '';
      return { token };
    }
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  console.log(`GraphQL endpoint disponible sur /graphql`);
}

// Démarrage du serveur Apollo
startApolloServer().catch(error => {
  console.error('Erreur au démarrage du serveur Apollo:', error);
});

// Routes REST API
app.use('/api/auth', authRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Gateway pour l\'application de covoiturage',
    endpoints: {
      rest: '/api',
      graphql: '/graphql'
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`API Gateway démarré sur le port ${PORT}`);
});