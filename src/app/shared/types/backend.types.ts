export interface RegistrationFieldError {
  field: string;
  message: string;
}

export interface RegistrationErrorResponse {
  message: string;
  field_errors: RegistrationFieldError[];
}

export interface AvailabilityResponse {
  available: boolean;
  field_errors?: RegistrationFieldError[];
}
