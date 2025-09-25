import { FormControl } from '@angular/forms';
import { sbpEmailRequirements, sbpEmailDomainRequired } from './emails';

describe('SBP Email Validator', () => {
  describe('sbpEmailDomainRequired', () => {
    it('should validate UNSW domains', () => {
      const validEmails = [
        'test@unsw.edu.au',
        'test@ad.unsw.edu.au',
        'test@student.unsw.edu.au',
      ];

      validEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toBeNull();
      });
    });

    it('should validate BioCommons domain', () => {
      const control = new FormControl('test@biocommons.org.au');
      expect(sbpEmailDomainRequired(control)).toBeNull();
    });

    it('should validate USyd domains', () => {
      const validEmails = ['test@sydney.edu.au', 'test@uni.sydney.edu.au'];

      validEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toBeNull();
      });
    });

    it('should validate WEHI domain', () => {
      const control = new FormControl('test@wehi.edu.au');
      expect(sbpEmailDomainRequired(control)).toBeNull();
    });

    it('should validate Monash domains', () => {
      const validEmails = ['test@monash.edu', 'test@student.monash.edu'];

      validEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toBeNull();
      });
    });

    it('should validate Griffith domains', () => {
      const validEmails = ['test@griffith.edu.au', 'test@griffithuni.edu.au'];

      validEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toBeNull();
      });
    });

    it('should validate UoM domains', () => {
      const validEmails = [
        'test@unimelb.edu.au',
        'test@student.unimelb.edu.au',
      ];

      validEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toBeNull();
      });
    });

    it('should reject invalid domains', () => {
      const invalidEmails = [
        'test@gmail.com',
        'test@yahoo.com',
        'test@hotmail.com',
        'test@example.com',
        'test@usyd.edu.au', // typo, should be sydney.edu.au
        'test@unsw.com', // wrong TLD
        'test@student.unsw.com', // wrong TLD
      ];

      invalidEmails.forEach((email) => {
        const control = new FormControl(email);
        expect(sbpEmailDomainRequired(control)).toEqual({
          invalidSbpEmailDomain: true,
        });
      });
    });

    it('should be case insensitive', () => {
      const control = new FormControl('TEST@UNSW.EDU.AU');
      expect(sbpEmailDomainRequired(control)).toBeNull();
    });
  });

  describe('sbpEmailRequirements', () => {
    it('should require email field', () => {
      const control = new FormControl('');
      const result = sbpEmailRequirements(control);
      expect(result).toEqual({ required: true });
    });

    it('should validate email format', () => {
      const control = new FormControl('invalid-email');
      const result = sbpEmailRequirements(control);
      expect(result?.email).toBe(true);
    });

    it('should validate domain restriction', () => {
      const control = new FormControl('test@gmail.com');
      const result = sbpEmailRequirements(control);
      expect(result?.invalidSbpEmailDomain).toBe(true);
    });

    it('should pass valid SBP emails', () => {
      const control = new FormControl('test@unsw.edu.au');
      const result = sbpEmailRequirements(control);
      expect(result).toBeNull();
    });
  });
});
