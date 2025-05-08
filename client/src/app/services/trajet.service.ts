import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Apollo, gql } from 'apollo-angular';

// Types pour les requêtes REST
interface TrajetResponse {
  success: boolean;
  message: string;
  trajet: any;
}

interface TrajetsResponse {
  success: boolean;
  message: string;
  trajets: any[];
}

interface BookingResponse {
  success: boolean;
  message: string;
  reservation: any;
  trajet: any;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrajetService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  // GraphQL queries et mutations
  private GET_ALL_TRAJETS = gql`
    query GetAllTrajets($filters: TrajetFilters) {
      trajets(filters: $filters) {
        success
        message
        trajets {
          id
          depart
          destination
          conducteurId
          conducteurNom
          dateDepart
          placesDisponibles
          placesReservees
          prix
          description
          dateCreation
          reservations {
            id
            passagerId
            passagerNom
            places
            dateReservation
          }
        }
      }
    }
  `;

  private GET_TRAJET_BY_ID = gql`
    query GetTrajetById($id: ID!) {
      trajet(id: $id) {
        success
        message
        trajet {
          id
          depart
          destination
          conducteurId
          conducteurNom
          dateDepart
          placesDisponibles
          placesReservees
          prix
          description
          dateCreation
          reservations {
            id
            passagerId
            passagerNom
            places
            dateReservation
          }
        }
      }
    }
  `;

  private GET_MES_TRAJETS = gql`
    query GetMesTrajets {
      mesTrajets {
        success
        message
        trajets {
          id
          depart
          destination
          conducteurId
          conducteurNom
          dateDepart
          placesDisponibles
          placesReservees
          prix
          description
          dateCreation
          reservations {
            id
            passagerId
            passagerNom
            places
            dateReservation
          }
        }
      }
    }
  `;

  private GET_MES_RESERVATIONS = gql`
    query GetMesReservations {
      mesReservations {
        success
        message
        trajets {
          id
          depart
          destination
          conducteurId
          conducteurNom
          dateDepart
          placesDisponibles
          placesReservees
          prix
          description
          dateCreation
          reservations {
            id
            passagerId
            passagerNom
            places
            dateReservation
          }
        }
      }
    }
  `;

  private CREATE_TRAJET = gql`
    mutation CreateTrajet($input: TrajetInput!) {
      createTrajet(input: $input) {
        success
        message
        trajet {
          id
          depart
          destination
          dateDepart
          placesDisponibles
          prix
          description
        }
      }
    }
  `;

  private UPDATE_TRAJET = gql`
    mutation UpdateTrajet($id: ID!, $input: UpdateTrajetInput!) {
      updateTrajet(id: $id, input: $input) {
        success
        message
        trajet {
          id
          depart
          destination
          dateDepart
          placesDisponibles
          prix
          description
        }
      }
    }
  `;

  private DELETE_TRAJET = gql`
    mutation DeleteTrajet($id: ID!) {
      deleteTrajet(id: $id) {
        success
        message
      }
    }
  `;

  private BOOK_TRAJET = gql`
    mutation BookTrajet($input: BookingInput!) {
      bookTrajet(input: $input) {
        success
        message
        reservation {
          id
          passagerId
          passagerNom
          places
          dateReservation
        }
        trajet {
          id
          placesDisponibles
          placesReservees
        }
      }
    }
  `;

  private CANCEL_BOOKING = gql`
    mutation CancelBooking($input: CancelBookingInput!) {
      cancelBooking(input: $input) {
        success
        message
      }
    }
  `;

  constructor(
    private http: HttpClient,
    private apollo: Apollo
  ) {}

  // Récupérer tous les trajets avec des filtres optionnels (REST)
  getAllTrajets(filters?: any): Observable<TrajetsResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.depart) params = params.set('depart', filters.depart);
      if (filters.destination) params = params.set('destination', filters.destination);
      if (filters.dateDepart) params = params.set('dateDepart', filters.dateDepart);
      if (filters.placesMinimum) params = params.set('placesMinimum', filters.placesMinimum);
      if (filters.prixMax) params = params.set('prixMax', filters.prixMax);
    }

    return this.http.get<TrajetsResponse>(`${this.apiUrl}/trajets`, { params });
  }

  // Récupérer un trajet par son ID (REST)
  getTrajetById(id: string): Observable<TrajetResponse> {
    return this.http.get<TrajetResponse>(`${this.apiUrl}/trajets/${id}`);
  }

  // Récupérer les trajets créés par l'utilisateur connecté (REST)
  getMesTrajets(): Observable<TrajetsResponse> {
    return this.http.get<TrajetsResponse>(`${this.apiUrl}/mes-trajets`);
  }

  // Récupérer les trajets réservés par l'utilisateur connecté (REST)
  getMesReservations(): Observable<TrajetsResponse> {
    return this.http.get<TrajetsResponse>(`${this.apiUrl}/mes-reservations`);
  }

  // Créer un nouveau trajet (REST)
  createTrajet(trajetData: any): Observable<TrajetResponse> {
    return this.http.post<TrajetResponse>(`${this.apiUrl}/trajets`, trajetData);
  }

  // Mettre à jour un trajet (REST)
  updateTrajet(id: string, trajetData: any): Observable<TrajetResponse> {
    return this.http.put<TrajetResponse>(`${this.apiUrl}/trajets/${id}`, trajetData);
  }

  // Supprimer un trajet (REST)
  deleteTrajet(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/trajets/${id}`);
  }

  // Réserver une place dans un trajet (REST)
  bookTrajet(trajetId: string, places: number): Observable<BookingResponse> {
    // S'assurer que places est un nombre entier valide et le convertir explicitement en nombre
    const seatsToBook = Number(Math.max(1, Math.floor(Number(places) || 1)));
    console.log('Booking with places:', seatsToBook, typeof seatsToBook); // Debug log
    return this.http.post<BookingResponse>(
      `${this.apiUrl}/trajets/${trajetId}/reservations`,
      { places: seatsToBook }
    );
  }

  // Annuler une réservation (REST)
  cancelBooking(trajetId: string, reservationId: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/trajets/${trajetId}/reservations/${reservationId}`);
  }

  // Méthodes GraphQL
  // Ces méthodes utilisent les requêtes et mutations GraphQL définies ci-dessus

  getAllTrajetsGql(filters?: any) {
    return this.apollo.watchQuery({
      query: this.GET_ALL_TRAJETS,
      variables: { filters }
    }).valueChanges;
  }

  getTrajetByIdGql(id: string) {
    return this.apollo.watchQuery({
      query: this.GET_TRAJET_BY_ID,
      variables: { id }
    }).valueChanges;
  }

  getMesTrajetsGql() {
    return this.apollo.watchQuery({
      query: this.GET_MES_TRAJETS
    }).valueChanges;
  }

  getMesReservationsGql() {
    return this.apollo.watchQuery({
      query: this.GET_MES_RESERVATIONS
    }).valueChanges;
  }

  createTrajetGql(input: any) {
    return this.apollo.mutate({
      mutation: this.CREATE_TRAJET,
      variables: { input },
      refetchQueries: [
        { query: this.GET_MES_TRAJETS }
      ]
    });
  }

  updateTrajetGql(id: string, input: any) {
    return this.apollo.mutate({
      mutation: this.UPDATE_TRAJET,
      variables: { id, input },
      refetchQueries: [
        { query: this.GET_MES_TRAJETS }
      ]
    });
  }

  deleteTrajetGql(id: string) {
    return this.apollo.mutate({
      mutation: this.DELETE_TRAJET,
      variables: { id },
      refetchQueries: [
        { query: this.GET_MES_TRAJETS }
      ]
    });
  }

  bookTrajetGql(trajetId: string, places: number) {
    return this.apollo.mutate({
      mutation: this.BOOK_TRAJET,
      variables: {
        input: {
          trajetId,
          places
        }
      },
      refetchQueries: [
        { query: this.GET_ALL_TRAJETS },
        { query: this.GET_MES_RESERVATIONS }
      ]
    });
  }

  cancelBookingGql(trajetId: string, reservationId: string) {
    return this.apollo.mutate({
      mutation: this.CANCEL_BOOKING,
      variables: {
        input: {
          trajetId,
          reservationId
        }
      },
      refetchQueries: [
        { query: this.GET_MES_RESERVATIONS }
      ]
    });
  }
}
