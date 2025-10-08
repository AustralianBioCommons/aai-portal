import { Routes } from '@angular/router';
import { ServicesComponent } from './pages/user/services/services.component';
import { AccessComponent } from './pages/user/access/access.component';
import { PendingComponent } from './pages/user/pending/pending.component';
import { RequestServiceComponent } from './pages/user/services/request-service/request-service.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AllUsersComponent } from './pages/admin/all-users/all-users.component';
import { PendingUsersComponent } from './pages/admin/pending-users/pending-users.component';
import { RevokedUsersComponent } from './pages/admin/revoked-users/revoked-users.component';
import { GalaxyRegisterComponent } from './pages/galaxy/register/galaxy-register.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { GalaxyLayoutComponent } from './layouts/galaxy-layout/galaxy-layout.component';
import { GalaxyRegisterSuccessComponent } from './pages/galaxy/register-success/galaxy-register-success.component';
import { BpaRegisterComponent } from './pages/bpa/register/bpa-register.component';
import { BpaRegistrationSuccessComponent } from './pages/bpa/registration-success/bpa-registration-success.component';
import { EmailVerifiedComponent } from './pages/email-verified/email-verified.component';
import { BpaRegisterSelectionComponent } from './pages/bpa/register-selection/bpa-register-selection.component';
import { GalaxyRegisterSelectionComponent } from './pages/galaxy/register-selection/galaxy-register-selection.component';
import { LoginComponent } from './pages/login/login.component';
import { loginGuard } from './core/guards/login.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { RegisterComponent } from './pages/register/register.component';
import { UserDetailsComponent } from './pages/admin/user-details/user-details.component';
import { UnverifiedUsersComponent } from './pages/admin/unverified-users/unverified-users.component';
import { SbpRegisterComponent } from './pages/sbp/register/sbp-register.component';
import { SbpRegistrationSuccessComponent } from './pages/sbp/registration-success/sbp-registration-success.component';
import { BpaLayoutComponent } from './layouts/bpa-layout/bpa-layout.component';
import { SbpLayoutComponent } from './layouts/sbp-layout/sbp-layout.component';

export const routes: Routes = [
  // Auth routes - only accessible when not logged in
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
    data: { title: 'Login | AAI Portal' },
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [loginGuard],
    data: { title: 'Register | AAI Portal' },
  },
  {
    path: 'user',
    canActivate: [loginGuard],
    children: [
      {
        path: 'email-verified',
        component: EmailVerifiedComponent,
        data: { title: 'Email Verification' },
      },
    ],
  },

  // Standalone routes without DefaultLayoutComponent
  {
    path: 'galaxy',
    component: GalaxyLayoutComponent,
    canActivate: [loginGuard],
    data: { favicon: '/assets/galaxy-favicon.ico' },
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      {
        path: 'register',
        component: GalaxyRegisterSelectionComponent,
        data: { title: 'Galaxy Australia - Register' },
      },
      {
        path: 'register/standard-access',
        component: GalaxyRegisterComponent,
        data: { title: 'Galaxy Australia - Register' },
      },
      {
        path: 'register/standard-access/success',
        component: GalaxyRegisterSuccessComponent,
        data: { title: 'Galaxy Australia - Registration successful' },
      },
      {
        path: 'register/bundle-access',
        component: RegisterComponent,
        canActivate: [loginGuard],
        data: { title: 'Galaxy Australia - Register' },
      },
    ],
  },
  {
    path: 'bpa',
    component: BpaLayoutComponent,
    canActivate: [loginGuard],
    data: { favicon: '/assets/bpa-favicon.ico' },
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      {
        path: 'register',
        component: BpaRegisterSelectionComponent,
        data: { title: 'Register | Bioplatforms Australia Data Portal' },
      },
      {
        path: 'register/standard-access',
        component: BpaRegisterComponent,
        data: { title: 'Register | Bioplatforms Australia Data Portal' },
      },
      {
        path: 'register/standard-access/success',
        component: BpaRegistrationSuccessComponent,
        data: {
          title: 'Registration Successful | Bioplatforms Australia Data Portal',
        },
      },
      {
        path: 'register/bundle-access',
        component: RegisterComponent,
        canActivate: [loginGuard],
        data: { title: 'Register | Bioplatforms Australia Data Portal' },
      },
    ],
  },
  {
    path: 'sbp',
    component: SbpLayoutComponent,
    canActivate: [loginGuard],
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      {
        path: 'register',
        component: SbpRegisterComponent,
        data: { title: 'Register | Structural Biology Platform' },
      },
      {
        path: 'register/success',
        component: SbpRegistrationSuccessComponent,
        data: { title: 'Registration Success | Structural Biology Platform' },
      },
    ],
  },

  // Authenticated routes that use DefaultLayoutComponent
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
        path: 'user/:id',
        component: UserDetailsComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'all-users',
        component: AllUsersComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'revoked-users',
        component: RevokedUsersComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'pending-users',
        component: PendingUsersComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'unverified-users',
        component: UnverifiedUsersComponent,
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
