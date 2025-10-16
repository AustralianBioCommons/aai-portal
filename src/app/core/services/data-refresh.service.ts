import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service to broadcast data refresh events across components
 */
@Injectable({
  providedIn: 'root',
})
export class DataRefreshService {
  private refreshSubject = new Subject<void>();

  // Observable that components can subscribe to
  refresh$ = this.refreshSubject.asObservable();

  /**
   * Trigger a data refresh across all listening components
   */
  triggerRefresh(): void {
    this.refreshSubject.next();
  }
}
