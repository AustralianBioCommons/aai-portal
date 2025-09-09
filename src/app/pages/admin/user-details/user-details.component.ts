import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';

@Component({
  selector: 'app-user-details',
  imports: [DatePipe],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.apiService.getUserDetails(userId).subscribe({
        next: (user) => {
          this.user.set(user);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load user details:', err);
          this.error.set('Failed to load user details');
          this.loading.set(false);
        },
      });
    } else {
      this.error.set('No user ID provided');
      this.loading.set(false);
    }
  }
}
