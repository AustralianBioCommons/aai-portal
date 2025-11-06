import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BiocommonsNavbarComponent } from '../../shared/components/biocommons-navbar/biocommons-navbar.component';

@Component({
  selector: 'app-sbp-layout',
  imports: [CommonModule, RouterOutlet, BiocommonsNavbarComponent],
  templateUrl: './sbp-layout.component.html',
  styleUrl: './sbp-layout.component.css',
})
export class SbpLayoutComponent {
  router = inject(Router);
}
