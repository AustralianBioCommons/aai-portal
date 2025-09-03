import { Component, computed, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ResolveFn,
} from '@angular/router';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export const userDetailsResolver: ResolveFn<BiocommonsUserDetails> = (
  route: ActivatedRouteSnapshot,
): Observable<BiocommonsUserDetails> => {
  const apiService = inject(ApiService);
  const userId = route.paramMap.get('id');
  return apiService.getUserDetails(userId!);
};

@Component({
  selector: 'app-user-details',
  imports: [],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent {
  private route = inject(ActivatedRoute);
  private data = toSignal(this.route.data);
  user = computed(() => this.data()?.['user']);

  constructor() {
    console.log(this.user());
  }
}
