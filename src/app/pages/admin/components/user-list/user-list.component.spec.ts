import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { UserListComponent } from './user-list.component';
import {
  ApiService,
  BiocommonsUserResponse,
  FilterOption,
} from '../../../../core/services/api.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockUsers: BiocommonsUserResponse[] = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      email_verified: true,
      created_at: '2023-01-01T00:00:00Z',
      platform_memberships: [],
      group_memberships: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      email_verified: true,
      created_at: '2023-01-02T00:00:00Z',
      platform_memberships: [],
      group_memberships: [],
    },
  ];

  const mockFilterOptions: FilterOption[] = [
    { id: 'group1', name: 'Group 1' },
    { id: 'group2', name: 'Group 2' },
  ];

  const mockGetUsers = jasmine
    .createSpy('getUsers')
    .and.returnValue(of(mockUsers));

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getFilterOptions']);
    mockApiService.getFilterOptions.and.returnValue(of(mockFilterOptions));

    await TestBed.configureTestingModule({
      imports: [UserListComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('title', 'Test Users');
    fixture.componentRef.setInput('getUsers', mockGetUsers);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load filter options on init', () => {
    fixture.detectChanges();
    expect(mockApiService.getFilterOptions).toHaveBeenCalled();
    expect(component.filterOptions()).toEqual(mockFilterOptions);
  });

  it('should load users on init', () => {
    fixture.detectChanges();
    expect(mockGetUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: 50,
      filterBy: '',
      search: '',
    });
    expect(component.users()).toEqual(mockUsers);
    expect(component.loading()).toBe(false);
  });

  it('should display the title', () => {
    fixture.detectChanges();
    const titleElement =
      fixture.debugElement.nativeElement.querySelector('.text-3xl');
    expect(titleElement.textContent).toContain('Test Users');
  });

  it('should display user count', () => {
    fixture.detectChanges();
    const countElement =
      fixture.debugElement.nativeElement.querySelector('.text-gray-500');
    expect(countElement.textContent).toContain('2 users');
  });

  it('should set loading state while loading users', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    component.loadUsers();
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading users', () => {
    const errorGetUsers = jasmine
      .createSpy('getUsers')
      .and.returnValue(throwError(() => new Error('API Error')));
    fixture.componentRef.setInput('getUsers', errorGetUsers);

    spyOn(console, 'error');
    component.loadUsers();

    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle error when loading filter options', () => {
    mockApiService.getFilterOptions.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    spyOn(console, 'error');
    fixture.detectChanges();

    expect(component.filterOptions()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should filter users based on search term', (done) => {
    fixture.detectChanges();

    component.searchTerm.set('user1');
    component.onSearchInput();

    setTimeout(() => {
      expect(mockGetUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 50,
        filterBy: '',
        search: 'user1',
      });
      done();
    }, 600);
  });

  it('should filter users based on selected filter', (done) => {
    fixture.detectChanges();

    component.selectedFilter.set('group1');
    component.onFilterChange();

    setTimeout(() => {
      expect(mockGetUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 50,
        filterBy: 'group1',
        search: '',
      });
      done();
    }, 0);
  });

  it('should reset search term when filter changes', () => {
    fixture.detectChanges();

    component.searchTerm.set('test');
    component.onFilterChange();

    expect(component.searchTerm()).toBe('');
  });

  it('should call loadUsers when manually invoked', () => {
    fixture.detectChanges();
    mockGetUsers.calls.reset();

    component.loadUsers();

    expect(mockGetUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: 50,
      filterBy: '',
      search: '',
    });
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();

    const destroySpy = spyOn(
      component['destroy$'] as Subject<void>,
      'next',
    ).and.callThrough();
    const completeSpy = spyOn(
      component['destroy$'] as Subject<void>,
      'complete',
    ).and.callThrough();

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should debounce search and not call API multiple times rapidly', (done) => {
    fixture.detectChanges();
    mockGetUsers.calls.reset();

    component.searchTerm.set('a');
    component.onSearchInput();

    component.searchTerm.set('ab');
    component.onSearchInput();

    component.searchTerm.set('abc');
    component.onSearchInput();

    setTimeout(() => {
      expect(mockGetUsers).toHaveBeenCalledTimes(1);
      expect(mockGetUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 50,
        filterBy: '',
        search: 'abc',
      });
      done();
    }, 600);
  });

  it('should not trigger search when the same term is entered (distinctUntilChanged)', (done) => {
    fixture.detectChanges();
    mockGetUsers.calls.reset();

    component.searchTerm.set('test');
    component.onSearchInput();

    setTimeout(() => {
      mockGetUsers.calls.reset();

      component.searchTerm.set('test');
      component.onSearchInput();

      setTimeout(() => {
        expect(mockGetUsers).not.toHaveBeenCalled();
        done();
      }, 600);
    }, 600);
  });
});
