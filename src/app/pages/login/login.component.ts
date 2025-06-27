import { Component } from '@angular/core';
import { LoginButtonComponent } from '../../shared/components/buttons/login-button/login-button.component';

@Component({
  selector: 'app-login',
  imports: [LoginButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

}
