// inline-edit-field.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-inline-edit-field',
  standalone: true,
  templateUrl: './inline-edit-field.component.html',
  host: { class: 'block' },
})
export class InlineEditFieldComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) fieldKey!: string;
  @Input({ required: true }) value!: string | null;
  @Input() type = 'text';
  @Input() saving = false;
  @Input() validators: ValidatorFn[] | null = null;
  @Input() invalidMessage = 'Invalid value';

  @Output() save = new EventEmitter<string>();

  isEditing = signal(false);
  editValue = signal('');
  validationError = signal<string | null>(null);

  // Internal control used only for validation
  control = new FormControl<string>('', { nonNullable: true });

  ngOnChanges(changes: SimpleChanges): void {
    if ('validators' in changes) {
      if (this.validators) {
        this.control.setValidators(this.validators);
      } else {
        this.control.clearValidators();
      }
      this.control.updateValueAndValidity({ emitEvent: false });
    }

    if ('value' in changes && !this.isEditing()) {
      // Keep control in sync when not editing
      this.control.setValue(this.value ?? '');
    }
  }

  startEdit(): void {
    this.editValue.set(this.value ?? '');
    this.isEditing.set(true);
  }

  cancel(): void {
    this.isEditing.set(false);
    this.validationError.set(null);
  }

  submit(): void {
    const newValue = this.editValue().trim();
    if (!newValue || newValue === this.value) {
      this.isEditing.set(false);
      this.validationError.set(null);
      return;
    }
    this.save.emit(newValue);
  }
}
