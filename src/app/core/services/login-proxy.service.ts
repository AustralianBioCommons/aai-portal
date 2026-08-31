import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface AafDomainsResponse {
  domains: string[];
}

export interface EmailCheckResponse {
  email: string;
  is_aaf: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LoginProxyService {
  private http = inject(HttpClient);
  private baseUrl = environment.auth0.loginProxyUrl.replace(/\/$/, '');

  getAafDomains(): Observable<string[]> {
    return this.http
      .get<AafDomainsResponse>(this.baseUrl + '/aaf/domains')
      .pipe(map((res: AafDomainsResponse) => res.domains));
  }

  checkAafEmail(email: string): Observable<boolean> {
    return this.http
      .get<EmailCheckResponse>(this.baseUrl + '/aaf/email-check', {
        params: { email: email },
      })
      .pipe(map((res: EmailCheckResponse) => res.is_aaf));
  }
}
