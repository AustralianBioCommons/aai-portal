import { FormBuilder, FormGroup } from '@angular/forms';
import { fullNameLengthValidator } from './full-name';

describe('fullNameLengthValidator', () => {
  let formBuilder: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    formBuilder = new FormBuilder();
    form = formBuilder.group(
      {
        firstName: [''],
        lastName: [''],
      },
      { validators: fullNameLengthValidator(20) },
    );
  });

  it('should not set errors when combined name is within limit', () => {
    form.patchValue({ firstName: 'John', lastName: 'Doe' });
    form.updateValueAndValidity();

    expect(form.hasError('fullNameTooLong')).toBe(false);
  });

  it('should set form-level error when combined name exceeds limit', () => {
    form.patchValue({ firstName: 'Christopher', lastName: 'Montgomery' });
    form.updateValueAndValidity();

    expect(form.hasError('fullNameTooLong')).toBe(true);
  });

  it('should clear errors when combined name becomes valid', () => {
    form.patchValue({ firstName: 'Christopher', lastName: 'Montgomery' });
    form.updateValueAndValidity();
    expect(form.hasError('fullNameTooLong')).toBe(true);

    form.patchValue({ firstName: 'Chris', lastName: 'Mont' });
    form.updateValueAndValidity();
    expect(form.hasError('fullNameTooLong')).toBe(false);
  });

  it('should handle empty values', () => {
    form.patchValue({ firstName: '', lastName: '' });
    form.updateValueAndValidity();

    expect(form.hasError('fullNameTooLong')).toBe(false);
  });

  it('should trim whitespace when calculating length', () => {
    form.patchValue({ firstName: '  John  ', lastName: '  Doe  ' });
    form.updateValueAndValidity();

    expect(form.hasError('fullNameTooLong')).toBe(false);
  });
});
