import { Component, input, output, computed } from '@angular/core';
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
  widthClass = input<string>('w-auto');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  clicked = output<void>();

  onClick() {
    if (!this.disabled() && !this.loading()) this.clicked.emit();
  }
}
