import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-register-selection',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './bpa-register-selection.component.html',
  styleUrl: './bpa-register-selection.component.css',
})
export class BpaRegisterSelectionComponent {}
