import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

export type ModalType = 'default' | 'revoke';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  // Inputs
  type = input<ModalType>('default');
  title = input.required<string>();
  description = input<string>('');
  primaryButtonText = input<string>('Confirm');
  secondaryButtonText = input<string>('Cancel');
  textareaControl = input<FormControl<string> | null>(null);
  textareaLabel = input<string>('Reason');
  textareaMaxLength = input<number>(1024);

  // Outputs
  primaryOutput = output<void>();
  secondaryOutput = output<void>();

  onPrimary(): void {
    this.primaryOutput.emit();
  }

  onSecondary(): void {
    this.secondaryOutput.emit();
  }
}
