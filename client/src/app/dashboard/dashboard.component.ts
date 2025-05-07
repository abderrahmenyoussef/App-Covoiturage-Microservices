import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { GraphQLModule } from '../graphql.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, GraphQLModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // If no user is authenticated, redirect to auth page
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth']);
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
}
