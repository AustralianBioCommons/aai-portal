import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { PLATFORM_NAMES } from '../../../core/constants/constants';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-user-details',
  imports: [
    DatePipe,
    LoadingSpinnerComponent,
    RouterLink,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private renderer = inject(Renderer2);

  protected readonly PLATFORM_NAMES = PLATFORM_NAMES;

  @ViewChild('actionMenu', { read: ElementRef }) actionMenu!: ElementRef;
  @ViewChild('actionMenuButton', { read: ElementRef })
  actionMenuButton!: ElementRef;

  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionMenuOpen = signal(false);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');

    // Get returnUrl from navigation state
    const navigation = this.router.getCurrentNavigation();
    const stateReturnUrl =
      navigation?.extras?.state?.['returnUrl'] || history.state?.returnUrl;

    if (stateReturnUrl) {
      this.returnUrl.set(stateReturnUrl);
    }

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
      this.alert.set({ type: 'error', message: 'No user ID available' });
      return;
    }

    this.alert.set(null);

    this.apiService.resendVerificationEmail(userId).subscribe({
      next: () => {
        this.alert.set({
          type: 'success',
          message: 'Verification email sent successfully',
        });
      },
      error: (error) => {
        console.error('Failed to resend verification email:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to resend verification email',
        });
      },
    });

    this.actionMenuOpen.set(false);
  }

  getPlatformName(platformId: string): string {
    return (
      this.PLATFORM_NAMES[platformId as keyof typeof PLATFORM_NAMES] ||
      platformId
    );
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
