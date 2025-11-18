// inline-edit-field.component.ts
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

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

  @Output() save = new EventEmitter<string>();

  isEditing = signal(false);
  editValue = signal('');

  startEdit(): void {
    this.editValue.set(this.value ?? '');
    this.isEditing.set(true);
  }

  cancel(): void {
    this.isEditing.set(false);
  }

  submit(): void {
    const newValue = this.editValue().trim();
    if (!newValue || newValue === this.value) {
      this.isEditing.set(false);
      return;
    }
    this.save.emit(newValue);
  }
}
