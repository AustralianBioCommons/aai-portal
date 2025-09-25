import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  @Input() type: AlertType = 'error';
  @Input() message = '';
  @Input() positionClass = 'right-6 top-6';
  @Input() dismissible = false;

  @Output() dismissed = new EventEmitter<void>();

  onDismiss() {
    this.dismissed.emit();
  }
}
