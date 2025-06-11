import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { servicesList } from '../../../../core/constants/constants';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-request-service',
  imports: [RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  standalone: true,
  templateUrl: './request-service.component.html',
  styleUrls: ['./request-service.component.css'],
})
export class RequestServiceComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private formBuilder = inject(FormBuilder);

  step = 0;
  remainingServices: any[] = [];
  selectedServices: any[] = [];
  user: any | null = {};
  loading = true;
  submitted = false;

  requestForm = this.formBuilder.group({
    services: this.formBuilder.group({}),
    selectedServices: this.formBuilder.group({}),
  });

  ngOnInit(): void {
    // this.auth.getUser().subscribe((user) => {
    //   this.user = user;
    //   if (user?.user_metadata?.services) {
    //     const approvedServiceIDs = user.user_metadata.services.approved || [];
    //     const requestedServiceIDs = user.user_metadata.services.requested || [];
    //     const excludedServiceIDs = [
    //       ...approvedServiceIDs,
    //       ...requestedServiceIDs,
    //     ];
    //     this.remainingServices = servicesList.filter(
    //       (service) => !excludedServiceIDs.includes(service.id),
    //     );
    //     // Dynamically add form controls for each remaining service
    //     const servicesGroup = this.requestForm.get('services') as FormGroup;
    //     this.remainingServices.forEach((service) => {
    //       servicesGroup.addControl(service.id, new FormControl(false));
    //     });
    //   } else {
    //     this.remainingServices = servicesList;
    //     // Dynamically add form controls for each remaining service
    //     const servicesGroup = this.requestForm.get('services') as FormGroup;
    //     this.remainingServices.forEach((service) => {
    //       servicesGroup.addControl(service.id, new FormControl(false));
    //     });
    //   }
    //   this.loading = false;
    // });
  }

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
    // const userId = this.user!.user_id!;
    // const selectedServiceIDs = this.selectedServices.map(
    //   (service) => service.id,
    // );

    // const updatePayload = {
    //   services: {
    //     ...(this.user?.user_metadata?.services || {}),
    //     requested: [
    //       ...(this.user?.user_metadata?.services?.requested || []),
    //       ...selectedServiceIDs,
    //     ],
    //   },
    // };

    // this.auth.updateUserMetadata(userId, updatePayload).subscribe({
    //   next: () => {},
    //   error: (error: any) => {
    //     console.error('Error updating user metadata', error);
    //   },
    // });

    this.submitted = true;
  }
}
