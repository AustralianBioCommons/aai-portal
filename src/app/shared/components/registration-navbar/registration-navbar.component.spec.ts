import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RegistrationNavbarComponent } from './registration-navbar.component';

describe('RegistrationNavbarComponent', () => {
  let component: RegistrationNavbarComponent;
  let fixture: ComponentFixture<RegistrationNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationNavbarComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('points logo link to the app root', () => {
    const link = fixture.debugElement.query(By.directive(RouterLink));
    expect(link).toBeTruthy();

    const router = TestBed.inject(Router);
    const routerLink = link.injector.get(RouterLink);
    expect(router.serializeUrl(routerLink.urlTree!)).toBe('/');
  });
});
