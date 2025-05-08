FROM node:16-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste des fichiers
COPY . .

# Exposer le port utilisé par le service gRPC
EXPOSE 50052

# Commande de démarrage
CMD ["node", "src/index.js"]