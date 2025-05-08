import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { TrajetService } from '../services/trajet.service';
import { GraphQLModule } from '../graphql.module';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface Ride {
  id: string;
  departure: string;
  arrival: string;
  date: Date;
  time: string;
  price: number;
  availableSeats: number;
  driverName?: string;
  driverRating?: number;
}

interface Reservation extends Ride {
  reservationId: string;
  places: number;
  reservationDate: Date;
}

// Interface pour les trajets venant de l'API
interface Trajet {
  id: string;
  depart: string;
  destination: string;
  conducteurId: number;
  conducteurNom: string;
  dateDepart: string;
  placesDisponibles: number;
  placesReservees: number;
  prix: number;
  description: string;
  dateCreation: string;
  reservations?: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, GraphQLModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  greetingMessage: string = '';
  isLoading = true;

  // Search form
  searchDeparture: string = '';
  searchArrival: string = '';
  searchDate: string = '';

  // Mock data for stats
  ecoStats = {
    co2Saved: 1250
  };

  communityStats = {
    activeUsers: 3500
  };

  routeStats = {
    sharedRides: 5200
  };

  // Data for rides
  driverRides: Ride[] = [];
  availableRides: Ride[] = [];
  userReservations: Reservation[] = []; // Ajout de la propriété pour les réservations
  selectedRide: Ride | null = null; // Pour afficher les détails d'un trajet
  showRideDetails = false; // Pour contrôler l'affichage des détails
  showConfirmation = false; // Pour afficher la confirmation de réservation
  placesToReserve = 1; // Nombre de places à réserver par défaut

  constructor(
    private authService: AuthService,
    private trajetService: TrajetService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Set the current date as default search date
    const today = new Date();
    this.searchDate = today.toISOString().split('T')[0];

    // Generate random greeting
    this.setRandomGreeting();

    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoading = false;

      // If no user is authenticated, redirect to auth page
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth']);
      } else {
        // Load real data based on user role
        this.loadRealData();
      }
    });

    // Verify the token on component initialization
    const token = this.authService.getToken();
    if (token) {
      this.authService.verifyToken(token).subscribe(isValid => {
        if (!isValid) {
          this.router.navigate(['/auth']);
        }
      });
    } else {
      this.router.navigate(['/auth']);
    }
  }

  setRandomGreeting(): void {
    const greetings = [
      'Ravi de vous revoir sur',
      'Bienvenue sur',
      'Heureux de vous retrouver sur',
      'Bon retour sur'
    ];

    const randomIndex = Math.floor(Math.random() * greetings.length);
    this.greetingMessage = greetings[randomIndex];
  }

  loadRealData(): void {
    this.isLoading = true;

    if (this.currentUser?.role === 'conducteur') {
      // Charger les trajets du conducteur
      this.trajetService.getMesTrajets().subscribe({
        next: (response) => {
          if (response.success && response.trajets) {
            this.driverRides = this.mapTrajetsToRides(response.trajets);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des trajets du conducteur', error);
          this.loadSampleData(); // Fallback to sample data
          this.isLoading = false;
        }
      });
    } else {
      // Commencer par charger les réservations de l'utilisateur
      this.trajetService.getMesReservations().subscribe({
        next: (response) => {
          if (response.success && response.trajets) {
            console.log('Réservations chargées:', response.trajets);
            this.userReservations = this.mapTrajetsToReservations(response.trajets);

            // Une fois les réservations chargées, charger les trajets disponibles
            this.loadAvailableRides();
          } else {
            this.userReservations = [];
            this.loadAvailableRides();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des réservations', error);
          this.loadSampleReservations();
          this.loadAvailableRides();
        }
      });
    }
  }

  // Nouvelle méthode pour charger les trajets disponibles en excluant ceux déjà réservés
  loadAvailableRides(): void {
    // Charger tous les trajets disponibles pour les passagers sans filtre
    this.trajetService.getAllTrajets({}).subscribe({
      next: (response) => {
        if (response.success && response.trajets) {
          const allRides = this.mapTrajetsToRides(response.trajets);

          // Filtrer les trajets déjà réservés par l'utilisateur
          this.availableRides = allRides.filter(ride =>
            !this.userReservations.some(reservation => reservation.id === ride.id)
          );
        } else {
          this.availableRides = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des trajets disponibles', error);
        this.loadSampleData(); // Fallback to sample data
        this.isLoading = false;
      }
    });
  }

  loadUserReservations(): void {
    this.trajetService.getMesReservations().subscribe({
      next: (response) => {
        if (response.success && response.trajets) {
          console.log('Réservations chargées:', response.trajets);
          this.userReservations = this.mapTrajetsToReservations(response.trajets);
        } else {
          this.userReservations = [];
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réservations', error);
        // Charger des données d'exemple pour les réservations en cas d'erreur
        this.loadSampleReservations();
      }
    });
  }

  loadSampleData(): void {
    // Sample data for driver rides
    this.driverRides = [
      {
        id: '1',
        departure: 'Paris',
        arrival: 'Lyon',
        date: new Date(2025, 4, 12),
        time: '08:30',
        price: 25,
        availableSeats: 3
      },
      {
        id: '2',
        departure: 'Lyon',
        arrival: 'Paris',
        date: new Date(2025, 4, 15),
        time: '15:00',
        price: 25,
        availableSeats: 2
      }
    ];

    // Sample data for available rides
    this.availableRides = [
      {
        id: '3',
        departure: 'Paris',
        arrival: 'Lyon',
        date: new Date(2025, 4, 12),
        time: '08:30',
        price: 25,
        availableSeats: 3,
        driverName: 'Thomas D.',
        driverRating: 4.8
      },
      {
        id: '4',
        departure: 'Paris',
        arrival: 'Lyon',
        date: new Date(2025, 4, 13),
        time: '14:15',
        price: 22,
        availableSeats: 2,
        driverName: 'Marie L.',
        driverRating: 4.6
      },
      {
        id: '5',
        departure: 'Paris',
        arrival: 'Lyon',
        date: new Date(2025, 4, 15),
        time: '10:00',
        price: 28,
        availableSeats: 1,
        driverName: 'Paul M.',
        driverRating: 4.9
      }
    ];

    // Si l'utilisateur est un passager, charger aussi des exemples de réservations
    if (this.currentUser?.role !== 'conducteur') {
      this.loadSampleReservations();
    }
  }

  loadSampleReservations(): void {
    // Exemple de données pour les réservations
    this.userReservations = [
      {
        id: '3',
        reservationId: 'r1',
        departure: 'Paris',
        arrival: 'Lyon',
        date: new Date(2025, 4, 20),
        time: '08:30',
        price: 25,
        availableSeats: 3,
        driverName: 'Thomas D.',
        driverRating: 4.8,
        places: 1,
        reservationDate: new Date(2025, 4, 1)
      },
      {
        id: '4',
        reservationId: 'r2',
        departure: 'Marseille',
        arrival: 'Nice',
        date: new Date(2025, 5, 5),
        time: '14:15',
        price: 18,
        availableSeats: 2,
        driverName: 'Julie M.',
        driverRating: 4.9,
        places: 2,
        reservationDate: new Date(2025, 4, 10)
      }
    ];
  }

  mapTrajetsToRides(trajets: Trajet[]): Ride[] {
    return trajets.map(trajet => {
      const date = new Date(trajet.dateDepart);
      return {
        id: trajet.id,
        departure: trajet.depart,
        arrival: trajet.destination,
        date: date,
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        price: trajet.prix,
        availableSeats: trajet.placesDisponibles,
        driverName: trajet.conducteurNom,
        driverRating: 4.5 // Par défaut, en attendant un système de notation
      };
    });
  }

  mapTrajetsToReservations(trajets: any[]): Reservation[] {
    return trajets.map(trajet => {
      const date = new Date(trajet.dateDepart);
      const reservation = trajet.reservations.find((r: any) =>
        r.passagerId === this.currentUser?.id
      );

      return {
        id: trajet.id,
        reservationId: reservation?.id || '',
        departure: trajet.depart,
        arrival: trajet.destination,
        date: date,
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        price: trajet.prix,
        availableSeats: trajet.placesDisponibles,
        driverName: trajet.conducteurNom,
        driverRating: 4.5,
        places: reservation?.places || 1,
        reservationDate: reservation?.dateReservation ? new Date(reservation.dateReservation) : new Date()
      };
    });
  }

  searchRides(): void {
    this.isLoading = true;

    const filters = {
      depart: this.searchDeparture,
      destination: this.searchArrival,
      dateDepart: this.searchDate,
      placesMinimum: 1
    };

    this.trajetService.getAllTrajets(filters).subscribe({
      next: (response) => {
        if (response.success && response.trajets) {
          const allFilteredRides = this.mapTrajetsToRides(response.trajets);

          // Filtrer les trajets déjà réservés par l'utilisateur
          this.availableRides = allFilteredRides.filter(ride =>
            !this.userReservations.some(reservation => reservation.id === ride.id)
          );
        } else {
          this.availableRides = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de trajets', error);
        this.isLoading = false;
      }
    });
  }

  proposeRide(): void {
    // Naviguer vers la page de création de trajet
    this.router.navigate(['/trajets/create']);
  }

  openRideModal(ride: Ride | null = null): void {
    if (ride) {
      // Si on a un trajet à modifier, naviguer vers la page d'édition
      this.router.navigate(['/trajets/edit', ride.id]);
    } else {
      // Sinon, naviguer vers la page de création
      this.router.navigate(['/trajets/create']);
    }
  }

  // Méthode améliorée pour réserver un trajet
  reserveRide(ride: Ride): void {
    this.selectedRide = ride;
    this.placesToReserve = 1; // Réinitialiser à 1 par défaut
    this.showConfirmation = true; // Afficher la confirmation
  }

  // Confirmer la réservation avec un nombre de places spécifié
  confirmReservation(): void {
    if (!this.selectedRide) return;

    // S'assurer que placesToReserve est un nombre entier valide
    const places = parseInt(String(this.placesToReserve));
    if (isNaN(places) || places <= 0) {
      Swal.fire({
        title: 'Erreur',
        text: 'Veuillez entrer un nombre de places valide (minimum 1).',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Vérifier si le nombre de places demandé est disponible
    if (places > this.selectedRide.availableSeats) {
      Swal.fire({
        title: 'Places insuffisantes',
        text: `Il n'y a que ${this.selectedRide.availableSeats} places disponibles pour ce trajet.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.trajetService.bookTrajet(this.selectedRide.id, places).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: 'Réservation confirmée!',
            text: 'Votre réservation a été effectuée avec succès!',
            icon: 'success',
            confirmButtonText: 'Super!'
          });
          this.showConfirmation = false;
          this.showRideDetails = false;
          this.loadRealData(); // Recharger les données
        } else {
          Swal.fire({
            title: 'Erreur',
            text: response.message || 'Une erreur est survenue lors de la réservation',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors de la réservation', error);
        let errorMessage = 'Une erreur est survenue lors de la réservation.';

        // Afficher des messages d'erreur plus précis en fonction du type d'erreur
        if (error.status === 400) {
          errorMessage += ' Vérifiez que le nombre de places demandé est disponible.';
        } else if (error.status === 401) {
          errorMessage += ' Vous devez être connecté pour effectuer une réservation.';
        } else if (error.status === 403) {
          errorMessage += ' Vous n\'avez pas les autorisations nécessaires.';
        }

        Swal.fire({
          title: 'Erreur',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Annuler la confirmation de réservation (fermer le modal)
  closeConfirmation(): void {
    this.showConfirmation = false;
  }

  editRide(ride: Ride): void {
    this.openRideModal(ride);
  }

  deleteRide(ride: Ride): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Voulez-vous vraiment supprimer ce trajet de ${ride.departure} à ${ride.arrival} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.trajetService.deleteTrajet(ride.id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire(
                'Supprimé!',
                'Votre trajet a été supprimé avec succès.',
                'success'
              );
              this.driverRides = this.driverRides.filter(r => r.id !== ride.id);
            } else {
              Swal.fire(
                'Erreur',
                response.message || 'Une erreur est survenue lors de la suppression',
                'error'
              );
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du trajet', error);
            Swal.fire(
              'Erreur',
              'Une erreur est survenue lors de la suppression du trajet',
              'error'
            );
          }
        });
      }
    });
  }

  formatReservationDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  cancelReservation(reservation: Reservation): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Voulez-vous vraiment annuler votre réservation pour le trajet de ${reservation.departure} à ${reservation.arrival} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, garder ma réservation'
    }).then((result) => {
      if (result.isConfirmed) {
        this.trajetService.cancelBooking(reservation.id, reservation.reservationId).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire(
                'Annulée!',
                'Votre réservation a été annulée avec succès.',
                'success'
              );
              // Supprimer la réservation de la liste des réservations
              this.userReservations = this.userReservations.filter(r => r.reservationId !== reservation.reservationId);

              // Recharger les trajets disponibles pour que le trajet annulé réapparaisse dans la liste
              this.loadAvailableRides();
            } else {
              Swal.fire(
                'Erreur',
                response.message || 'Une erreur est survenue lors de l\'annulation',
                'error'
              );
            }
          },
          error: (error) => {
            console.error('Erreur lors de l\'annulation de la réservation', error);
            Swal.fire(
              'Erreur',
              'Une erreur est survenue lors de l\'annulation de la réservation',
              'error'
            );
          }
        });
      }
    });
  }

  getMonthName(date: Date): string {
    return date.toLocaleString('fr-FR', { month: 'short' });
  }

  getDay(date: Date): number {
    return date.getDate();
  }

  // Afficher les détails d'un trajet sélectionné
  showRideDetail(ride: Ride): void {
    this.selectedRide = ride;
    this.showRideDetails = true;
  }

  // Fermer les détails d'un trajet
  closeRideDetail(): void {
    this.showRideDetails = false;
    this.selectedRide = null;
  }
}
