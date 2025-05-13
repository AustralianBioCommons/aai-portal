import { Routes } from '@angular/router';
import { ServicesComponent } from './pages/user/services/services.component';
import { AccessComponent } from './pages/user/access/access.component';
import { PendingComponent } from './pages/user/pending/pending.component';
import { RequestServiceComponent } from './pages/user/services/request-service/request-service.component';
import { NotFoundComponent } from './pages/shared/not-found/not-found.component';
import { ListUsersComponent } from './pages/admin/list-users/list-users.component';
import { RequestsComponent } from './pages/admin/requests/requests.component';
import { RevokedComponent } from './pages/admin/revoked/revoked.component';
import { RegisterComponent } from './pages/galaxy/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/services', pathMatch: 'full' },
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
  { path: 'galaxy/register', component: RegisterComponent},
  { path: '**', component: NotFoundComponent },
];
