import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestServiceComponent } from './request-service.component';
import {provideMockAuth0Service, provideMockAuthService} from '../../../../../utils/testingUtils';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import { By } from '@angular/platform-browser';

describe('RequestServiceComponent', () => {
  let component: RequestServiceComponent;
  let fixture: ComponentFixture<RequestServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestServiceComponent],
      providers: [provideMockAuth0Service(), provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('RequestServiceComponent with existing user', () => {
  let component: RequestServiceComponent;
  let fixture: ComponentFixture<RequestServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestServiceComponent],
      providers: [
        // Set mock user with some systems already approved
        provideMockAuthService({
          isAuthenticated: true,
          user: {
            user_metadata: {systems: {approved: ["TSI_SH", "BPA_DP"], requested: ["GX_AU"]}}}
        }),
        provideHttpClient(),
        provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RequestServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show remaining systems in form', () => {
    const debugEl = fixture.debugElement;
    const control = debugEl.query(By.css('input[name="SBP"]'));
    expect(control).not.toBeNull();
    const label = debugEl.query(By.css('#SBP-label'));
    expect(label.nativeElement.textContent).toContain('Structural Biology Platform');
  });

  it('approved and requested systems should not be shown', () => {
    const debugEl = fixture.debugElement;
    console.log(fixture.componentInstance.user)
    console.log(fixture.componentInstance.remainingSystems);
    console.log(fixture.componentInstance.selectedSystems);
    const approved_system = debugEl.query(By.css('input[name="TSI_SH"]'));
    expect(approved_system).toBeNull();
    const requested_system = debugEl.query(By.css('input[name="GX_AU"]'));
    expect(requested_system).toBeNull();
  })
});
