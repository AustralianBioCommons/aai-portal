import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-bpa-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './bpa-layout.component.html',
  styleUrl: './bpa-layout.component.css',
})
export class BpaLayoutComponent {
  router = inject(Router);
}
