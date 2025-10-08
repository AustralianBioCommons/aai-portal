import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sbp-layout',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sbp-layout.component.html',
  styleUrl: './sbp-layout.component.css',
})
export class SbpLayoutComponent {
  router = inject(Router);
}
