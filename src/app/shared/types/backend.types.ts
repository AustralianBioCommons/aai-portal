export interface RegistrationFieldError {
  field: string;
  message: string;
}

export interface RegistrationErrorResponse {
  message: string;
  field_errors: RegistrationFieldError[];
}
