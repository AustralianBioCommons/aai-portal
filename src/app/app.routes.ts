import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AllUsersComponent } from './pages/admin/all-users/all-users.component';
import { PendingUsersComponent } from './pages/admin/pending-users/pending-users.component';
import { RevokedUsersComponent } from './pages/admin/revoked-users/revoked-users.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { EmailVerifiedComponent } from './pages/email-verified/email-verified.component';
import { LoginComponent } from './pages/login/login.component';
import { loginGuard } from './core/guards/login.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';
import { RegisterComponent } from './pages/register/register.component';
import { UserDetailsComponent } from './pages/admin/user-details/user-details.component';
import { UnverifiedUsersComponent } from './pages/admin/unverified-users/unverified-users.component';
import { SbpRegisterComponent } from './pages/sbp/register/sbp-register.component';
import { SbpRegistrationSuccessComponent } from './pages/sbp/registration-success/sbp-registration-success.component';
import { SbpLayoutComponent } from './layouts/sbp-layout/sbp-layout.component';
import { ProfileComponent } from './pages/user/profile/profile.component';
import { BundlesComponent } from './pages/user/bundles/bundles.component';

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
        path: '',
        pathMatch: 'full',
        canActivate: [rootRedirectGuard],
        children: [],
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'bundles',
        component: BundlesComponent,
        data: { title: 'Select Bundles' },
      },
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
