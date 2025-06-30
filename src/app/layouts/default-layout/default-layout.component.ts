import { Component, OnInit, inject } from '@angular/core';
import { FooterComponent } from "../footer/footer.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { Router, RouterOutlet } from "@angular/router";
import { AuthService } from '../../core/services/auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { filter, switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-default-layout',
  imports: [FooterComponent, NavbarComponent, RouterOutlet],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.css',
})
export class DefaultLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private auth0Service = inject(Auth0Service);
  private router = inject(Router);

  ngOnInit() {
    if (this.router.url === '/') {
      this.auth0Service.isLoading$.pipe(
        filter(isLoading => !isLoading),
        switchMap(() => this.auth0Service.isAuthenticated$),
        take(1),
        switchMap(isAuthenticated => {
          if (isAuthenticated) {
            return this.authService.isAdmin();
          }
          return [false];
        })
      ).subscribe(isAdmin => {
        if (isAdmin) {
          this.router.navigate(['/all-users']);
        } else {
          this.router.navigate(['/services']);
        }
      });
    }
  }
}
