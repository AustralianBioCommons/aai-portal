import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-register-selection',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './galaxy-register-selection.component.html',
  styleUrl: './galaxy-register-selection.component.css',
})
export class GalaxyRegisterSelectionComponent {}
