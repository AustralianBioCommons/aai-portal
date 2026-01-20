import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { heroShieldCheck } from '@ng-icons/heroicons/outline';
import { NgIcon, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-first-migration',
  imports: [NgIcon],
  templateUrl: './first-migration.component.html',
  styleUrl: './first-migration.component.css',
  viewProviders: [provideIcons({ heroShieldCheck })],
})
export class FirstMigrationComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
}
