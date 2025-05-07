const { gql } = require('apollo-server-express');

const authTypeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    token: String
    userId: ID
    username: String
    role: String
  }

  type TokenVerificationResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    role: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input TokenInput {
    token: String!
  }
`;

module.exports = authTypeDefs;