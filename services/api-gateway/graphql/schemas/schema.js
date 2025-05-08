const { gql } = require('apollo-server-express');
const authTypeDefs = require('../types/authTypes');
const trajetTypeDefs = require('../types/trajetTypes');
const iaTypeDefs = require('../types/iaTypes');

const rootTypeDefs = gql`
  type Query {
    verifyToken(token: String!): TokenVerificationResponse
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse
    login(input: LoginInput!): AuthResponse
    logout(token: String!): LogoutResponse
  }
`;

module.exports = [rootTypeDefs, authTypeDefs, trajetTypeDefs, iaTypeDefs];