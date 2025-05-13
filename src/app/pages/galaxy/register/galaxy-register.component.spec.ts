import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GalaxyRegisterComponent } from './galaxy-register.component';

describe('GalaxyRegisterComponent', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, GalaxyRegisterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function markAllAsTouched() {
    Object.values(component.registerForm.controls).forEach(control => {
      control.markAsTouched();
    });
    fixture.detectChanges();
  }

  it('should create the form with default empty values', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('password_confirmation')?.value).toBe('');
    expect(component.registerForm.get('public_name')?.value).toBe('');
  });

  it('should detect mismatching passwords', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['password_confirmation'].setValue('notmatching');
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('should not show mismatch error when passwords match', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['password_confirmation'].setValue('password123');
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
  });

  it('should invalidate public_name with uppercase letters', () => {
    component.registerForm.controls['public_name'].setValue('InvalidName');
    expect(component.registerForm.controls['public_name'].valid).toBeFalse();
    expect(component.registerForm.controls['public_name'].errors?.['pattern']).toBeTruthy();
  });

  it('should invalidate public_name with special characters', () => {
    component.registerForm.controls['public_name'].setValue('bad$name!');
    expect(component.registerForm.controls['public_name'].valid).toBeFalse();
    expect(component.registerForm.controls['public_name'].errors?.['pattern']).toBeTruthy();
  });

  it('should accept a valid public_name', () => {
    component.registerForm.controls['public_name'].setValue('valid_name-123');
    expect(component.registerForm.controls['public_name'].valid).toBeTrue();
  });

  it('should show "Your public name should contain only..." when public_name is invalid', () => {
    component.registerForm.controls['public_name'].setValue('Invalid@Name');
    markAllAsTouched();

    const errorElements: NodeListOf<HTMLElement> = fixture.debugElement.nativeElement.querySelectorAll('small');
    const patternError = Array.from(errorElements).find((e) => {
      return e.textContent?.includes('Your public name should contain only');
    });
    expect(patternError).toBeTruthy();
  });
});
