import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galaxy-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './galaxy-layout.component.html',
  styleUrl: './galaxy-layout.component.css',
})
export class GalaxyLayoutComponent {
  constructor(public router: Router) {}
}
