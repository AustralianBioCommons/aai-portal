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
  message = input<string>('');
  positionClass = input<string>(DEFAULT_POSITION);
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  onDismiss() {
    this.dismissed.emit();
  }
}
