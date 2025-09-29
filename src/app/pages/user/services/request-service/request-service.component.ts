import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { BiocommonsAuth0User } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

interface ServiceOption {
  id: string;
  name: string;
  url: string;
}

@Component({
  selector: 'app-request-service',
  imports: [RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './request-service.component.html',
  styleUrl: './request-service.component.css',
})
export class RequestServiceComponent {
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  step = 0;
  remainingServices: ServiceOption[] = [];
  selectedServices: ServiceOption[] = [];
  user: BiocommonsAuth0User | null = null;
  loading = true;
  submitted = false;

  requestForm = this.formBuilder.group({
    services: this.formBuilder.group({}),
    selectedServices: this.formBuilder.group({}),
  });

  nextStep() {
    if (this.step === 0) {
      this.selectedServices = this.remainingServices.filter(
        (service) => this.requestForm.get('services')?.get(service.id)?.value,
      );

      if (this.selectedServices.length === 0) {
        alert('Please select at least one service.');
        return;
      }

      // Dynamically add form controls for each selected service
      const selectedServicesGroup = this.requestForm.get(
        'selectedServices',
      ) as FormGroup;
      this.selectedServices.forEach((service) => {
        selectedServicesGroup.addControl(service.id, new FormControl(false));
      });
    } else if (this.step === 1) {
      const allChecked = this.selectedServices.every(
        (service) =>
          this.requestForm.get('selectedServices')?.get(service.id)?.value,
      );

      if (!allChecked) {
        alert(
          'Please accept the terms and conditions for all selected services.',
        );
        return;
      }
    } else if (this.step === 2) {
      this.submitForm();
      return;
    }
    this.step++;
  }

  prevStep() {
    if (this.step === 0) {
      this.router.navigate(['/services']);
    } else {
      this.step--;
    }
  }

  setButtonText() {
    switch (this.step) {
      case 0:
        return 'Next';
      case 1:
        return 'Accept';
      case 2:
        return 'Submit';
      default:
        return '';
    }
  }

  submitForm() {
    this.submitted = true;
  }
}
