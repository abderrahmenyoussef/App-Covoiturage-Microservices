import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';
import { GraphQLModule } from '../graphql.module';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, GraphQLModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        if (response.success) {
          // Navigate to login page after logout
          this.router.navigate(['/auth']);
        } else {
          console.error('Logout failed:', response.message);
        }
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
