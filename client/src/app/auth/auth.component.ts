import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { GraphQLModule } from '../graphql.module';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GraphQLModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Initialize register form
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['passager', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Connexion réussie!';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Échec de connexion. Vérifiez vos informations.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur s\'est produite lors de la connexion.';
        console.error('Login error:', error);
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const { username, email, password, role } = this.registerForm.value;
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.register(username, email, password, role).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Inscription réussie! Vous êtes maintenant connecté.';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Échec d\'inscription.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur s\'est produite lors de l\'inscription.';
        console.error('Registration error:', error);
      }
    });
  }
}
