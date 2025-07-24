import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-selection',
  imports: [RouterLink],
  templateUrl: './galaxy-register-selection.component.html',
  styleUrl: './galaxy-register-selection.component.css',
})
export class GalaxyRegisterSelectionComponent {
  private titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Galaxy Australia - Register');
  }
}
