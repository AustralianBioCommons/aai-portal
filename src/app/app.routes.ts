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
import { BpaRegistrationComponent } from './pages/shared/bpa-registration/bpa-registration.component';

export const routes: Routes = [
  // Standalone route without DefaultLayout
  {
    path: 'galaxy',
    component: GalaxyLayoutComponent,
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: GalaxyRegisterComponent },
    ],
  },
  {
    path: 'bpa',
    component: BpaRegistrationComponent,
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      { path: 'register', component: BpaRegistrationComponent },
    ],
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
