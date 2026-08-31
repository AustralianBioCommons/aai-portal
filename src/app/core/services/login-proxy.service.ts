import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface AafDomainsResponse {
  domains: string[];
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
}
