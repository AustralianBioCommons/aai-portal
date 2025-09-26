import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error';

const DEFAULT_POSITION = 'right-6 top-6';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  type = input<AlertType>('error');
  positionClass = input<string>(DEFAULT_POSITION);
  message = input<string>('');
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
