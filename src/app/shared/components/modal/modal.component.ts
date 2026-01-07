import { Component, input, output, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

export type ModalType = 'default' | 'revoke' | 'reject';

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
  primaryButtonDisabled = input<boolean>(false);
  primaryButtonLoading = input<boolean>(false);
  textareaLabel = input<string | undefined>();
  textareaControl = input<FormControl<string> | null>(null);
  textareaMaxLength = input<number>(255);

  // Computed values
  readonly showTextarea = computed(() => {
    const type = this.type();
    return (type === 'revoke' || type === 'reject') && this.textareaControl();
  });

  readonly computedTextareaLabel = computed(() => {
    return (
      this.textareaLabel() ??
      (this.type() === 'reject' ? 'Rejection reason' : 'Revocation reason')
    );
  });

  readonly computedPrimaryButtonText = computed(() => {
    return ['reject', 'revoke'].includes(this.type())
      ? 'Yes'
      : this.primaryButtonText();
  });

  readonly computedSecondaryButtonText = computed(() => {
    return ['reject', 'revoke'].includes(this.type())
      ? 'No'
      : this.secondaryButtonText();
  });

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
