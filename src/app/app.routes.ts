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
import { RegisterSelectionComponent } from './pages/bpa/register-selection/register-selection.component';

export const routes: Routes = [
  // Standalone route without DefaultLayout
  {
    path: 'galaxy',
    component: GalaxyLayoutComponent,
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: GalaxyRegisterComponent },
      { path: 'register-success', component: GalaxyRegisterSuccessComponent },
    ],
  },
  {
    path: 'bpa',
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: RegisterSelectionComponent },
      { path: 'register/standard-account', component: BpaRegisterComponent },
      {
        path: 'registration-success',
        component: BpaRegistrationSuccessComponent,
      },
    ],
  },
  {
    path: 'user', children: [
      {path: 'email-verified', component: EmailVerifiedComponent}
    ]
  },

  // All other routes use DefaultLayoutComponent
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: '', redirectTo: 'services', pathMatch: 'full' },
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
      { path: 'all-users', component: ListUsersComponent },
      { path: 'revoked', component: RevokedComponent },
      { path: 'requests', component: RequestsComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
