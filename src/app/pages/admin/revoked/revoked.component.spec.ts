import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RevokedComponent } from './revoked.component';

describe('RevokedComponent', () => {
  let component: RevokedComponent;
  let fixture: ComponentFixture<RevokedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevokedComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RevokedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
