import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonType = 'button' | 'submit';
export type ButtonVariant = 'primary' | 'secondary';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  type = input<ButtonType>('button');
  variant = input<ButtonVariant>('primary');
  colorClasses = input<string | undefined>();
  widthClass = input<string>('w-28');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
}
