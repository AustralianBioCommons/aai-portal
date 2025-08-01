import { FormControl } from '@angular/forms';
import { usernameRequirements } from './usernames';

describe('usernameRequirements', () => {
  it('should return null for valid usernames', () => {
    // Arrange
    const validUsernames = [
      'user123',
      'test-user',
      'john_doe',
      'a-b-c',
      'abc',
      'a'.repeat(100) // Maximum length
    ];

    // Act & Assert
    validUsernames.forEach(username => {
      const control = new FormControl(username);
      const result = usernameRequirements(control);
      expect(result).toBeNull();
    });
  });

  it('should validate minimum length', () => {
    // Arrange
    const tooShortUsernames = ['a', 'ab'];

    // Act & Assert
    tooShortUsernames.forEach(username => {
      const control = new FormControl(username);
      const result = usernameRequirements(control);
      expect(result).not.toBeNull();
      expect([result?.minlength, result?.required]).toBeTruthy();
    });
  });

  it('should validate maximum length', () => {
    // Arrange
    const tooLongUsername = 'a'.repeat(101); // 101 characters
    const control = new FormControl(tooLongUsername);

    // Act
    const result = usernameRequirements(control);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.maxlength).toBeTruthy();
  });

  it('should validate pattern requirement', () => {
    // Arrange
    const invalidPatternUsernames = [
      'User123', // Uppercase letter
      'user@123', // Special character @
      'user.name', // Period not allowed
      'user name', // Space not allowed
      'üser123', // Non-ASCII character
      'UPPERCASE'
    ];

    // Act & Assert
    invalidPatternUsernames.forEach(username => {
      const control = new FormControl(username);
      const result = usernameRequirements(control);
      expect(result).not.toBeNull();
      expect(result?.pattern).toBeTruthy();
    });
  });

  it('should return multiple errors for usernames with multiple violations', () => {
    // Arrange
    const control = new FormControl('A'); // Too short and uppercase

    // Act
    const result = usernameRequirements(control);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.minlength).toBeTruthy();
    expect(result?.pattern).toBeTruthy();
  });

  it('should handle null and undefined values', () => {
    // Arrange
    const nullControl = new FormControl(null);
    const undefinedControl = new FormControl(undefined);

    // Act
    const nullResult = usernameRequirements(nullControl);
    const undefinedResult = usernameRequirements(undefinedControl);

    // Assert
    expect(nullResult).not.toBeNull();
    expect(undefinedResult).not.toBeNull();
    expect(nullResult?.required).toBeTruthy();
    expect(undefinedResult?.required).toBeTruthy();
  });
});
