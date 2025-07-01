import { Routes } from '@angular/router';
import { ServicesComponent } from './pages/user/services/services.component';
import { AccessComponent } from './pages/user/access/access.component';
import { PendingComponent } from './pages/user/pending/pending.component';
import { RequestServiceComponent } from './pages/user/services/request-service/request-service.component';
import { NotFoundComponent } from './pages/shared/not-found/not-found.component';
import { ListUsersComponent } from './pages/admin/list-users/list-users.component';
import { RequestsComponent } from './pages/admin/requests/requests.component';
import { RevokedComponent } from './pages/admin/revoked/revoked.component';
import { GalaxyRegisterComponent } from './pages/galaxy/register/galaxy-register.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { GalaxyLayoutComponent } from './layouts/galaxy-layout/galaxy-layout.component';
import { GalaxyRegisterSuccessComponent } from './pages/galaxy/register-success/galaxy-register-success.component';
import { BpaRegisterComponent } from './pages/bpa/register/bpa-register.component';
import { BpaRegistrationSuccessComponent } from './pages/bpa/registration-success/bpa-registration-success.component';
import { EmailVerifiedComponent } from './pages/user/email-verified/email-verified.component';
import { BpaRegisterSelectionComponent } from './pages/bpa/register-selection/bpa-register-selection.component';
import { GalaxyRegisterSelectionComponent } from './pages/galaxy/register-selection/galaxy-register-selection.component';
import { LoginComponent } from './pages/login/login.component';
import { loginGuard } from './core/guards/login.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Login route - only accessible when not logged in
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  // Standalone route without DefaultLayout
  {
    path: 'galaxy',
    component: GalaxyLayoutComponent,
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: GalaxyRegisterSelectionComponent },
      { path: 'register/standard-account', component: GalaxyRegisterComponent },
      { path: 'register-success', component: GalaxyRegisterSuccessComponent },
    ],
  },
  {
    path: 'bpa',
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: BpaRegisterSelectionComponent },
      { path: 'register/standard-account', component: BpaRegisterComponent },
      {
        path: 'registration-success',
        component: BpaRegistrationSuccessComponent,
      },
    ],
  },
  {
    path: 'user',
    children: [{ path: 'email-verified', component: EmailVerifiedComponent }],
  },

  // All other routes use DefaultLayoutComponent
  {
    path: '',
    component: DefaultLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'services',
        component: ServicesComponent,
        children: [
          {
            path: 'request',
            component: RequestServiceComponent,
          },
        ],
      },
      { path: 'access', component: AccessComponent },
      { path: 'pending', component: PendingComponent },
      {
        path: 'all-users',
        component: ListUsersComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'revoked',
        component: RevokedComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'requests',
        component: RequestsComponent,
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
