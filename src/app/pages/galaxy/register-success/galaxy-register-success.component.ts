import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-register-success',
  imports: [],
  templateUrl: './galaxy-register-success.component.html',
  styleUrl: './galaxy-register-success.component.css'
})
export class GalaxyRegisterSuccessComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle('Galaxy Australia - Registration successful');
  }
}
