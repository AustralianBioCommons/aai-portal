import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';
import {
  heroCheckCircleSolid,
  heroXCircleSolid,
} from '@ng-icons/heroicons/solid';

export type AlertType = 'success' | 'error';

@Component({
  selector: 'app-alert',
  imports: [CommonModule, NgIcon],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
  viewProviders: [
    provideIcons({ heroCheckCircleSolid, heroXCircleSolid, heroXMark }),
  ],
})
export class AlertComponent {
  type = input<AlertType>('error');
  message = input<string>('');
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
