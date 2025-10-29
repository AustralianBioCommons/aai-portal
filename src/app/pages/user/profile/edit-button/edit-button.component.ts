import { Component, input } from '@angular/core';

@Component({
  selector: 'app-edit-button',
  imports: [],
  templateUrl: './edit-button.component.html',
  styleUrl: './edit-button.component.css',
})
export class EditButtonComponent {
  text = input<string>('Edit');
}
