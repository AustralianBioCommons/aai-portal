import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { systemsList } from '../../../../core/constants/constants';
import {
  AuthService,
  UserWithMetadata,
} from '../../../../core/services/auth.service';
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
  remainingSystems: any[] = [];
  selectedSystems: any[] = [];
  user: UserWithMetadata | null = {};
  loading = true;
  submitted = false;

  requestForm = this.formBuilder.group({
    systems: this.formBuilder.group({}),
    selectedSystems: this.formBuilder.group({}),
  });

  ngOnInit(): void {
    this.auth.getUser().subscribe((user) => {
      this.user = user;
      if (user?.user_metadata?.systems) {
        const approvedSystemIDs = user.user_metadata.systems.approved || [];
        const requestedSystemIDs = user.user_metadata.systems.requested || [];
        const excludedSystemIDs = [...approvedSystemIDs, ...requestedSystemIDs];

        this.remainingSystems = systemsList.filter(
          (system) => !excludedSystemIDs.includes(system.id),
        );

        // Dynamically add form controls for each remaining system
        const systemsGroup = this.requestForm.get('systems') as FormGroup;
        this.remainingSystems.forEach((system) => {
          systemsGroup.addControl(system.id, new FormControl(false));
        });
      } else {
        this.remainingSystems = systemsList;

        // Dynamically add form controls for each remaining system
        const systemsGroup = this.requestForm.get('systems') as FormGroup;
        this.remainingSystems.forEach((system) => {
          systemsGroup.addControl(system.id, new FormControl(false));
        });
      }
      this.loading = false;
    });
  }

  nextStep() {
    if (this.step === 0) {
      this.selectedSystems = this.remainingSystems.filter(
        (system) => this.requestForm.get('systems')?.get(system.id)?.value,
      );

      if (this.selectedSystems.length === 0) {
        alert('Please select at least one system.');
        return;
      }

      // Dynamically add form controls for each selected system
      const selectedSystemsGroup = this.requestForm.get(
        'selectedSystems',
      ) as FormGroup;
      this.selectedSystems.forEach((system) => {
        selectedSystemsGroup.addControl(system.id, new FormControl(false));
      });
    } else if (this.step === 1) {
      const allChecked = this.selectedSystems.every(
        (system) =>
          this.requestForm.get('selectedSystems')?.get(system.id)?.value,
      );

      if (!allChecked) {
        alert(
          'Please accept the terms and conditions for all selected systems.',
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
    const userId = this.user!.user_id!;
    const selectedSystemIDs = this.selectedSystems.map((system) => system.id);

    const updatePayload = {
      systems: {
        ...(this.user?.user_metadata?.systems || {}),
        requested: [
          ...(this.user?.user_metadata?.systems?.requested || []),
          ...selectedSystemIDs,
        ],
      },
    };

    this.auth.updateUserMetadata(userId, updatePayload).subscribe({
      next: () => {},
      error: (error: any) => {
        console.error('Error updating user metadata', error);
      },
    });

    this.submitted = true;
  }
}
