import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { NgIf } from '@angular/common';


interface GalaxyRegistrationForm {
  email: FormControl<string>;
  password: FormControl<string>;
  password_confirmation: FormControl<string>;
  public_name: FormControl<string>;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup<GalaxyRegistrationForm>;

  passwordMatchValidator(group: AbstractControl<GalaxyRegistrationForm>): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  constructor(private formBuilder: FormBuilder) {
    this.registerForm = formBuilder.group({
      email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
      password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]}),
      password_confirmation: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]}),
      public_name: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.pattern(/[a-z0-9._-]/)]}),
    }, {validators: [this.passwordMatchValidator]})
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Form Submitted', this.registerForm.value);
      // You could call a service here to submit the registration data
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
