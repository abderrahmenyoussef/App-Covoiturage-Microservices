import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Apollo } from 'apollo-angular';
import { gql } from '@apollo/client/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

// GraphQL mutations and queries
const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
      token
      userId
      username
      role
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      token
      userId
      username
      role
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout($token: String!) {
    logout(token: $token) {
      success
      message
    }
  }
`;

const VERIFY_TOKEN_QUERY = gql`
  query VerifyToken($token: String!) {
    verifyToken(token: $token) {
      success
      message
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export interface User {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  userId?: string;
  username?: string;
  role?: string;
}

interface RegisterResult {
  register: AuthResponse;
}

interface LoginResult {
  login: AuthResponse;
}

interface VerifyTokenResult {
  verifyToken: {
    success: boolean;
    message: string;
    user?: User;
  };
}

interface LogoutResult {
  logout: {
    success: boolean;
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apollo: Apollo
  ) {
    this.checkToken();
  }

  // Check if token exists in local storage and verify it
  private checkToken() {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.verifyToken(token).subscribe();
    }
  }

  // Register user using GraphQL
  register(username: string, email: string, password: string, role: string = 'user'): Observable<AuthResponse> {
    return this.apollo.mutate<RegisterResult>({
      mutation: REGISTER_MUTATION,
      variables: {
        input: { username, email, password, role }
      }
    }).pipe(
      map(result => {
        if (result.data) {
          return result.data.register;
        }
        return { success: false, message: 'Registration failed' };
      }),
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.currentUserSubject.next({
            id: response.userId,
            username: response.username,
            role: response.role
          });
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return of({ success: false, message: 'An error occurred during registration' });
      })
    );
  }

  // Login user using GraphQL
  login(email: string, password: string): Observable<AuthResponse> {
    return this.apollo.mutate<LoginResult>({
      mutation: LOGIN_MUTATION,
      variables: {
        input: { email, password }
      }
    }).pipe(
      map(result => {
        if (result.data) {
          return result.data.login;
        }
        return { success: false, message: 'Login failed' };
      }),
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.currentUserSubject.next({
            id: response.userId,
            username: response.username,
            role: response.role
          });
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({ success: false, message: 'An error occurred during login' });
      })
    );
  }

  // Verify token using GraphQL
  verifyToken(token: string): Observable<boolean> {
    return this.apollo.query<VerifyTokenResult>({
      query: VERIFY_TOKEN_QUERY,
      variables: { token }
    }).pipe(
      map(result => {
        if (result.data) {
          const response = result.data.verifyToken;
          if (response && response.success && response.user) {
            this.currentUserSubject.next(response.user);
            return true;
          }
        }
        localStorage.removeItem(this.tokenKey);
        this.currentUserSubject.next(null);
        return false;
      }),
      catchError(() => {
        localStorage.removeItem(this.tokenKey);
        this.currentUserSubject.next(null);
        return of(false);
      })
    );
  }

  // Logout user using GraphQL
  logout(): Observable<{success: boolean, message: string}> {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      localStorage.removeItem(this.tokenKey);
      this.currentUserSubject.next(null);
      return of({ success: true, message: 'Logged out successfully' });
    }

    return this.apollo.mutate<LogoutResult>({
      mutation: LOGOUT_MUTATION,
      variables: { token }
    }).pipe(
      map(result => {
        if (result.data) {
          return result.data.logout;
        }
        return { success: true, message: 'Logged out' };
      }),
      tap(() => {
        localStorage.removeItem(this.tokenKey);
        this.currentUserSubject.next(null);
      }),
      catchError(error => {
        console.error('Logout error:', error);
        localStorage.removeItem(this.tokenKey);
        this.currentUserSubject.next(null);
        return of({ success: true, message: 'Logged out successfully' });
      })
    );
  }

  // Get current user from BehaviorSubject
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get token from local storage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
