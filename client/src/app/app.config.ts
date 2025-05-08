import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
// Importation d'Apollo via le module GraphQL
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

// Enregistrement de la locale française
registerLocaleData(localeFr);

// Configuration Apollo
export function createApolloOptions(httpLink: HttpLink) {
  const uri = 'http://localhost:3000/graphql';

  // Auth link pour ajouter le token aux requêtes
  const auth = setContext((_, { headers }) => {
    const token = localStorage.getItem('auth_token');
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      }
    };
  });

  // Création du lien http
  const http = httpLink.create({ uri });

  return {
    link: ApolloLink.from([auth, http]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    // Fournir Apollo correctement
    Apollo,
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApolloOptions,
      deps: [HttpLink]
    },
    { provide: LOCALE_ID, useValue: 'fr' } // Définir français comme locale par défaut
  ]
};
