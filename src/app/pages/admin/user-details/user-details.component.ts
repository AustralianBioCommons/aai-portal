import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [DatePipe, LoadingSpinnerComponent, RouterLink],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private renderer = inject(Renderer2);

  @ViewChild('actionMenu', { read: ElementRef }) actionMenu!: ElementRef;
  @ViewChild('actionMenuButton', { read: ElementRef })
  actionMenuButton!: ElementRef;

  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionMenuOpen = signal(false);

  platformNames: Record<string, string> = {
    bpa_data_portal: 'Bioplatforms Australia Data Portal',
    galaxy: 'Galaxy Australia',
  };

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

    this.setupClickOutsideMenuHandler();
  }

  toggleActionMenu() {
    this.actionMenuOpen.set(!this.actionMenuOpen());
  }

  resendVerificationEmail() {
    const userId = this.user()?.user_id;
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    this.apiService.resendVerificationEmail(userId).subscribe({
      next: (response) => {
        console.log(
          'Verification email resent successfully:',
          response.message,
        );
        // TODO: Show success notification to user
      },
      error: (error) => {
        console.error('Failed to resend verification email:', error);
        // TODO: Show error notification to user
      },
    });

    this.actionMenuOpen.set(false);
  }

  getPlatformName(platformId: string): string {
    return this.platformNames[platformId] || platformId;
  }

  private setupClickOutsideMenuHandler() {
    this.renderer.listen('window', 'click', (e: Event) => {
      const target = e.target as Element;
      if (
        !this.actionMenuButton?.nativeElement.contains(target) &&
        !this.actionMenu?.nativeElement.contains(target)
      ) {
        this.actionMenuOpen.set(false);
      }
    });
  }
}
