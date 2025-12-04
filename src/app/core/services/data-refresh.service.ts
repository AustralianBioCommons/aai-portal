import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service when one component needs to tell others to re-fetch or recompute data,
 * without sharing any actual state.
 *
 * Example: page change triggers navbar to refresh its counts.
 */
@Injectable({
  providedIn: 'root',
})
export class DataRefreshService {
  /**
   * Internal subject used to broadcast refresh events.
   */
  private readonly refreshSubject = new Subject<void>();

  /**
   * Public stream components can subscribe to.
   * Emits whenever triggerRefresh() is called.
   */
  public readonly refresh$ = this.refreshSubject.asObservable();

  /**
   * Broadcast a refresh event to all subscribers.
   * Call this after actions that should cause dependent UI/data to update.
   */
  triggerRefresh(): void {
    this.refreshSubject.next();
  }
}
