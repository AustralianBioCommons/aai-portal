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
import { FirstMigrationComponent } from './pages/first-migration/first-migration.component';
import { RecoverEmailComponent } from './pages/recover-email/recover-email.component';
import { BiocommonsTermsComponent } from './pages/terms/biocommons-terms/biocommons-terms.component';

export const routes: Routes = [
  // Auth routes - only accessible when not logged in
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
    data: { title: 'Login | BioCommons Access' },
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [loginGuard],
    data: { title: 'Register | BioCommons Access' },
  },
  {
<<<<<<< HEAD
=======
    path: 'recover-email',
    component: RecoverEmailComponent,
    canActivate: [loginGuard],
    data: { title: 'Recover Login Email | BioCommons Access' },
  },
  {
    path: 'terms/biocommons',
    component: BiocommonsTermsComponent,
    data: { title: 'BioCommons Access Terms & Conditions' },
  },
  {
>>>>>>> 431594d (feat: add terms and conditions)
    path: 'user',
    canActivate: [loginGuard],
    children: [
      {
        path: 'email-verified',
        component: EmailVerifiedComponent,
        data: { title: 'Email Verification | BioCommons Access' },
      },
      {
        path: 'email-verification-required',
        component: EmailVerificationRequiredComponent,
        data: { title: 'Verify Your Email | BioCommons Access' },
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
  {
    path: 'migration',
    component: FirstMigrationComponent,
    data: { title: 'Account Migration | BioCommons Access Portal' },
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
        data: { title: 'Profile | BioCommons Access Portal' },
      },
      {
        path: 'profile/request-bundle',
        component: BundlesComponent,
        data: { title: 'Request Bundle Access | BioCommons Access Portal' },
      },
      {
        path: 'user/:id',
        component: UserDetailsComponent,
        canActivate: [adminGuard],
        data: { title: 'User Details | BioCommons Access Portal' },
      },
      {
        path: 'all-users',
        component: AllUsersComponent,
        canActivate: [adminGuard],
        data: { title: 'All Users | BioCommons Access Portal' },
      },
      {
        path: 'revoked-users',
        component: RevokedUsersComponent,
        canActivate: [adminGuard],
        data: { title: 'Revoked Users | BioCommons Access Portal' },
      },
      {
        path: 'pending-users',
        component: PendingUsersComponent,
        canActivate: [adminGuard],
        data: { title: 'Pending Users | BioCommons Access Portal' },
      },
      {
        path: 'unverified-users',
        component: UnverifiedUsersComponent,
        canActivate: [adminGuard],
        data: { title: 'Unverified Users | BioCommons Access Portal' },
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
