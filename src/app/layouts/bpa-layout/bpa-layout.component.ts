import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-bpa-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './bpa-layout.component.html',
  styleUrl: './bpa-layout.component.css',
})
export class BpaLayoutComponent {
  router = inject(Router);
  readonly bpaPlatformUrl = environment.platformUrls.bpaPlatform.replace(
    /\/+$/,
    '',
  );
}
