import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstMigrationComponent } from './first-migration.component';

describe('FirstMigrationComponent', () => {
  let component: FirstMigrationComponent;
  let fixture: ComponentFixture<FirstMigrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstMigrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirstMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
