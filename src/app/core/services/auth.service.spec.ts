import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import {provideMockAuth0Service} from '../../../utils/testingUtils';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockAuth0Service(), provideHttpClient(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
