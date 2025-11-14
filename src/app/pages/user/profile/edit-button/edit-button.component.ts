import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-edit-button',
  imports: [],
  templateUrl: './edit-button.component.html',
  styleUrl: './edit-button.component.css',
})
export class EditButtonComponent {
  text = input<string>('Edit');
  pressed = output<void>();

  onClick(): void {
    this.pressed.emit();
  }
}
