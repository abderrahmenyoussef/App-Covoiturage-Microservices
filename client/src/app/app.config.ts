import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { GraphQLModule } from './graphql.module';
import { authInterceptor } from './services/auth.interceptor';
import { Apollo } from 'apollo-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(GraphQLModule),
    Apollo // Ajout explicite du service Apollo
  ]
};
