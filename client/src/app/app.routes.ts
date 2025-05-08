import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TrajetFormComponent } from './trajets/trajet-form/trajet-form.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trajets/create', component: TrajetFormComponent },
  { path: 'trajets/edit/:id', component: TrajetFormComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
