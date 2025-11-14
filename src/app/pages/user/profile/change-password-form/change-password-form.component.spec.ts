import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ChangePasswordFormComponent } from './change-password-form.component';
import { ApiService } from '../../../../core/services/api.service';
import { ValidationService } from '../../../../core/services/validation.service';

describe('ChangePasswordFormComponent', () => {
  let component: ChangePasswordFormComponent;
  let fixture: ComponentFixture<ChangePasswordFormComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj('ApiService', ['changePassword']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordFormComponent],
      providers: [
        ValidationService,
        { provide: ApiService, useValue: apiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillForm() {
    component.form.setValue({
      currentPassword: 'CurrentPass123!',
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    });
  }

  it('submits the form and emits success', () => {
    const emitSpy = jasmine.createSpy('emitSpy');
    component.completed.subscribe(emitSpy);
    apiService.changePassword.and.returnValue(of(void 0));

    fillForm();
    component.submit();

    expect(apiService.changePassword).toHaveBeenCalledWith({
      current_password: 'CurrentPass123!',
      new_password: 'NewPass123!',
    });
    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: 'success',
      }),
    );
  });

  it('emits an error when the API call fails', () => {
    const emitSpy = jasmine.createSpy('emitSpy');
    component.completed.subscribe(emitSpy);
    apiService.changePassword.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { detail: 'Current password is incorrect.' },
            status: 400,
          }),
      ),
    );

    fillForm();
    component.submit();

    expect(emitSpy).toHaveBeenCalledWith({
      type: 'error',
      message: 'Current password is incorrect.',
    });
  });

  it('emits cancelled when the user aborts the flow', () => {
    const cancelSpy = jasmine.createSpy('cancelSpy');
    component.cancelled.subscribe(cancelSpy);

    component.cancel();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
