import {
  Component,
  input,
  output,
  computed,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

export type ModalType = 'default' | 'revoke' | 'reject' | 'delete';

const TEXTAREA_LABELS: Record<ModalType, string> = {
  default: 'Reason',
  revoke: 'Revocation reason',
  reject: 'Rejection reason',
  delete: 'Deletion reason',
};

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);

  // Inputs
  type = input<ModalType>('default');
  title = input.required<string>();
  description = input<string>('');
  primaryButtonText = input<string>('Confirm');
  secondaryButtonText = input<string>('Cancel');
  primaryButtonWidthClass = input<string>('w-28');
  secondaryButtonWidthClass = input<string>('w-28');
  primaryButtonLoading = input<boolean>(false);

  textareaControl = input<FormControl<string> | null>(null);
  textareaMaxLength = input<number>(255);

  readonly computedTextareaLabel = computed(() => TEXTAREA_LABELS[this.type()]);

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

  ngOnInit(): void {
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(document.body, 'overflow');
  }

  onPrimary(): void {
    this.primaryOutput.emit();
  }

  onSecondary(): void {
    this.secondaryOutput.emit();
  }
}
