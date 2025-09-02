import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { ListUsersComponent } from './list-users.component';
import {
  ApiService,
  FilterOption,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

describe('ListUsersComponent', () => {
  let component: ListUsersComponent;
  let fixture: ComponentFixture<ListUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockFilterOptions: FilterOption[] = [
    { id: 'australian', name: 'Australian universities' },
    { id: 'international', name: 'International' },
  ];

  const mockUsers: BiocommonsUserResponse[] = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getFilterOptions',
      'getUsers',
    ]);

    await TestBed.configureTestingModule({
      imports: [ListUsersComponent, FormsModule, LoadingSpinnerComponent],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListUsersComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Default mock responses
    mockApiService.getFilterOptions.and.returnValue(of(mockFilterOptions));
    mockApiService.getUsers.and.returnValue(of(mockUsers));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load filter options and users on init', () => {
    fixture.detectChanges();

    expect(mockApiService.getFilterOptions).toHaveBeenCalled();
    expect(mockApiService.getUsers).toHaveBeenCalledWith(1, 50, undefined);
    expect(component.filterOptions).toEqual(mockFilterOptions);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBeFalse();
  });

  it('should handle filter options error', () => {
    mockApiService.getFilterOptions.and.returnValue(
      throwError(() => new Error('Filter options error')),
    );

    fixture.detectChanges();

    expect(component.filterOptions).toEqual([]);
  });

  it('should handle users loading error', () => {
    mockApiService.getUsers.and.returnValue(
      throwError(() => new Error('Users loading error')),
    );

    fixture.detectChanges();

    expect(component.users).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('should reload users when filter changes', () => {
    fixture.detectChanges();
    mockApiService.getUsers.calls.reset();

    component.selectedFilter = 'australian';
    component.loadUsers();

    expect(mockApiService.getUsers).toHaveBeenCalledWith(1, 50, 'australian');
  });

  it('should set loading state correctly during user loading', () => {
    expect(component.loading).toBeFalse();

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
  });
});
