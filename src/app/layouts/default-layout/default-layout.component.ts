import { Component, inject } from '@angular/core';
import { FooterComponent } from "../footer/footer.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { Router, RouterOutlet } from "@angular/router";
import { AuthService } from '../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-default-layout',
  imports: [FooterComponent, NavbarComponent, RouterOutlet],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.css',
})
export class DefaultLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    if (this.router.url === '/') {
      toObservable(this.authService.isLoading).pipe(
        filter(isLoading => !isLoading),
        take(1)
      ).subscribe(() => {
        const isAuthenticated = this.authService.isAuthenticated();
        const isAdmin = this.authService.isAdmin();

        if (isAuthenticated) {
          if (isAdmin) {
            this.router.navigate(['/all-users']);
          } else {
            this.router.navigate(['/services']);
          }
        }
      });
    }
  }
}
