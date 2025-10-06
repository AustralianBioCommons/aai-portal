import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PendingUsersComponent } from './pending-users.component';
import { ApiService } from '../../../core/services/api.service';

describe('PendingUsersComponent', () => {
  let component: PendingUsersComponent;
  let fixture: ComponentFixture<PendingUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminPendingUsers',
      'getFilterOptions',
    ]);
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PendingUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    expect(component.title).toBe('Pending Requests');
  });

  it('should bind getUsers to the correct API method', () => {
    const params = {
      page: 1,
      perPage: 50,
      filterBy: '',
      search: '',
    };

    component.getUsers(params).subscribe();

    expect(mockApiService.getAdminPendingUsers).toHaveBeenCalledWith(params);
  });
});
