// passwords.spec.ts
import { FormControl } from '@angular/forms';
import {
  lowercaseRequired,
  uppercaseRequired,
  digitRequired,
  specialCharacterRequired,
  passwordRequirements,
  ALLOWED_SPECIAL_CHARACTERS,
} from './passwords';

describe('Password Validators', () => {
  describe('lowercaseRequired validator', () => {
    it('should return null when password contains a lowercase letter', () => {
      const control = new FormControl('Test123!');
      const result = lowercaseRequired(control);
      expect(result).toBeNull();
    });

    it('should return error when password does not contain a lowercase letter', () => {
      const control = new FormControl('TEST123!');
      const result = lowercaseRequired(control);
      expect(result).toEqual({ lowercaseRequired: true });
    });

    it('should return error for empty password', () => {
      const control = new FormControl('');
      const result = lowercaseRequired(control);
      expect(result).toEqual({ lowercaseRequired: true });
    });
  });

  describe('uppercaseRequired validator', () => {
    it('should return null when password contains an uppercase letter', () => {
      const control = new FormControl('Test123!');
      const result = uppercaseRequired(control);
      expect(result).toBeNull();
    });

    it('should return error when password does not contain an uppercase letter', () => {
      const control = new FormControl('test123!');
      const result = uppercaseRequired(control);
      expect(result).toEqual({ uppercaseRequired: true });
    });

    it('should return error for empty password', () => {
      const control = new FormControl('');
      const result = uppercaseRequired(control);
      expect(result).toEqual({ uppercaseRequired: true });
    });

    it('should handle null value', () => {
      const control = new FormControl(null);
      const result = uppercaseRequired(control);
      expect(result).toEqual({ uppercaseRequired: true });
    });
  });

  describe('digitRequired validator', () => {
    it('should return null when password contains a digit', () => {
      const control = new FormControl('Test123!');
      const result = digitRequired(control);
      expect(result).toBeNull();
    });

    it('should return error when password does not contain a digit', () => {
      const control = new FormControl('TestAbc!');
      const result = digitRequired(control);
      expect(result).toEqual({ digitRequired: true });
    });

    it('should return error for empty password', () => {
      const control = new FormControl('');
      const result = digitRequired(control);
      expect(result).toEqual({ digitRequired: true });
    });

    it('should handle null value', () => {
      const control = new FormControl(null);
      const result = digitRequired(control);
      expect(result).toEqual({ digitRequired: true });
    });
  });

  describe('specialCharacterRequired validator', () => {
    it('should return null when password contains a special character', () => {
      const control = new FormControl('Test123!');
      const result = specialCharacterRequired(control);
      expect(result).toBeNull();
    });

    it('should return error when password does not contain a special character', () => {
      const control = new FormControl('Test123');
      const result = specialCharacterRequired(control);
      expect(result).toEqual({ specialCharacterRequired: true });
    });

    it('should return error for empty password', () => {
      const control = new FormControl('');
      const result = specialCharacterRequired(control);
      expect(result).toEqual({ specialCharacterRequired: true });
    });

    it('should handle null value', () => {
      const control = new FormControl(null);
      const result = specialCharacterRequired(control);
      expect(result).toEqual({ specialCharacterRequired: true });
    });

    it('should only accept special characters defined in ALLOWED_SPECIAL_CHARACTERS', () => {
      // Test for all allowed special characters
      for (const char of ALLOWED_SPECIAL_CHARACTERS) {
        const control = new FormControl(`Test123${char}`);
        const result = specialCharacterRequired(control);
        expect(result).toBeNull();
      }

      // Test for a non-allowed special character (not in OWASP list)
      const control = new FormControl('Test123🙂');
      const result = specialCharacterRequired(control);
      expect(result).toEqual({ specialCharacterRequired: true });
    });
  });

  describe('passwordRequirements validator', () => {
    it('should return null when password meets all requirements', () => {
      const control = new FormControl('Test123!');
      const result = passwordRequirements(control);
      expect(result).toBeNull();
    });

    it('should return multiple errors when password fails multiple requirements', () => {
      const control = new FormControl('');
      const result = passwordRequirements(control);
      expect(result).toEqual({
        required: true,
        lowercaseRequired: true,
        uppercaseRequired: true,
        digitRequired: true,
        specialCharacterRequired: true,
      });
    });

    it('should return specific errors when password fails some requirements', () => {
      const control = new FormControl('test');
      const result = passwordRequirements(control);
      expect(result).toEqual({
        minlength: { requiredLength: 8, actualLength: 4 },
        uppercaseRequired: true,
        digitRequired: true,
        specialCharacterRequired: true,
      });

      const control2 = new FormControl('TEST123');
      const result2 = passwordRequirements(control2);
      expect(result2).toEqual({
        minlength: { requiredLength: 8, actualLength: 7 },
        lowercaseRequired: true,
        specialCharacterRequired: true,
      });
    });
  });
});
