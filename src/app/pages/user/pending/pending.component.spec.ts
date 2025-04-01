import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingComponent } from './pending.component';
import {provideMockAuth0Service} from '../../../../utils/testingUtils';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';

describe('PendingComponent', () => {
  let component: PendingComponent;
  let fixture: ComponentFixture<PendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingComponent],
      providers: [provideMockAuth0Service(), provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
