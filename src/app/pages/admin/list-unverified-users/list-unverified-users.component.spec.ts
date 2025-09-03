import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListUnverifiedUsersComponent } from './list-unverified-users.component';

describe('ListUnverifiedUsersComponent', () => {
  let component: ListUnverifiedUsersComponent;
  let fixture: ComponentFixture<ListUnverifiedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListUnverifiedUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListUnverifiedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
