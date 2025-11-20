import {
  Component,
  EventEmitter,
  Output,
  signal,
  effect,
  untracked,
  input,
} from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-inline-edit-field',
  standalone: true,
  templateUrl: './inline-edit-field.component.html',
  host: { class: 'block' },
})
export class InlineEditFieldComponent {
  label = input.required<string>();
  fieldKey = input.required<string>();
  type = input<string>('text');
  saving = input.required<boolean>();
  validators = input<ValidatorFn[] | null>(null);
  invalidMessage = input<string>('Invalid value');
  helpText = input<string>('');
  value = input.required<string>();

  @Output() save = new EventEmitter<string>();

  isEditing = signal(false);
  validationError = signal<string | null>(null);

  // Internal control used only for validation
  control = new FormControl<string>('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.validators()) {
        this.control.setValidators(this.validators());
      } else {
        this.control.clearValidators();
      }
      this.control.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      // Keep control in sync when not editing (e.g. user updated from outside)
      if (!untracked(this.isEditing)) {
        this.control.setValue(this.value() ?? '', { emitEvent: false });
      }
    });
  }

  startEdit(): void {
    const current = this.value() ?? '';
    this.control.setValue(current, { emitEvent: false });
    this.control.markAsPristine();
    this.control.markAsUntouched();
    this.validationError.set(null);
    this.isEditing.set(true);
  }

  cancel(): void {
    this.isEditing.set(false);
    this.validationError.set(null);
  }

  onInput(value: string): void {
    this.control.setValue(value);
    this.control.markAsDirty();
    this.control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    this.validationError.set(null);
  }

  submit(): void {
    this.control.markAsTouched();
    this.control.updateValueAndValidity();

    if (this.control.invalid) {
      this.validationError.set(this.invalidMessage());
      return;
    }

    const newValue = this.control.value.trim();

    // If nothing changed, just close
    if (!newValue || newValue === (this.value() ?? '')) {
      this.isEditing.set(false);
      this.validationError.set(null);
      return;
    }

    this.validationError.set(null);
    this.save.emit(newValue);
  }
}
