import {
  Component,
  inject,
  effect,
  Renderer2,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { LoginButtonComponent } from '../../shared/components/buttons/login-button/login-button.component';
import { LogoutButtonComponent } from '../../shared/components/buttons/logout-button/logout-button.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    LoginButtonComponent,
    LogoutButtonComponent,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnDestroy {
  private auth = inject(AuthService);
  private renderer = inject(Renderer2);
  private router = inject(Router);

  @ViewChild('menu', { read: ElementRef }) menu!: ElementRef;
  @ViewChild('userMenuButton', { read: ElementRef })
  userMenuButton!: ElementRef;

  isAuthenticated = this.auth.isAuthenticated();
  user!: any;
  userMenuOpen = false;
  private userSubscription!: Subscription;

  constructor() {
    effect(() => {
      this.isAuthenticated = this.auth.isAuthenticated();
      this.userSubscription = this.auth.getUser().subscribe((user) => {
        this.user = user;
      });
    });

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        !this.userMenuButton?.nativeElement.contains(e.target) &&
        !this.menu?.nativeElement.contains(e.target)
      ) {
        this.userMenuOpen = false;
      }
    });
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
