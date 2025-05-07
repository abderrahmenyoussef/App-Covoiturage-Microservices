import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { GraphQLModule } from '../graphql.module';
import { FormsModule } from '@angular/forms';

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

  // Sample rides data (in a real app, this would come from a backend)
  driverRides: Ride[] = [];
  availableRides: Ride[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
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
        // Load sample data based on user role
        this.loadSampleData();
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
  }

  searchRides(): void {
    // In a real app, this would call a backend API
    console.log('Searching rides:', {
      departure: this.searchDeparture,
      arrival: this.searchArrival,
      date: this.searchDate
    });
    // Here we would update the availableRides array with the search results
  }

  proposeRide(): void {
    // Navigate to a ride creation form
    console.log('Proposing new ride');
    // this.router.navigate(['/propose-ride']);
  }

  reserveRide(ride: Ride): void {
    console.log('Reserving ride:', ride);
    // Here we would show a confirmation dialog or navigate to a booking page
  }

  editRide(ride: Ride): void {
    console.log('Editing ride:', ride);
    // Navigate to edit form
  }

  deleteRide(ride: Ride): void {
    console.log('Deleting ride:', ride);
    // Show confirmation dialog and then delete
  }

  getMonthName(date: Date): string {
    return date.toLocaleString('fr-FR', { month: 'short' });
  }

  getDay(date: Date): number {
    return date.getDate();
  }
}
