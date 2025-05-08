import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';
import { environment } from '../../environments/environment';

// Interface pour la demande de prédiction de prix
export interface PricePredictionRequest {
  placesDisponibles: number;
  depart?: string;
  destination?: string;
}

// Interface pour la réponse de prédiction de prix
export interface PricePredictionResponse {
  success: boolean;
  message: string;
  prixEstime: number;
}

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private apollo: Apollo
  ) { }

  // Méthode REST pour prédire le prix d'un trajet
  predictPrice(request: PricePredictionRequest): Observable<PricePredictionResponse> {
    return this.http.post<PricePredictionResponse>(`${this.apiUrl}/ia/predict-price`, request);
  }

  // Méthode GraphQL pour prédire le prix d'un trajet
  predictPriceGraphQL(request: PricePredictionRequest): Observable<any> {
    return this.apollo.query<any>({
      query: gql`
        query PredictPrice($input: PricePredictionInput!) {
          predictPrice(input: $input) {
            success
            message
            prixEstime
          }
        }
      `,
      variables: {
        input: request
      }
    });
  }

  // Méthode pour vérifier l'état du service IA
  checkServiceHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ia/health`);
  }
}
