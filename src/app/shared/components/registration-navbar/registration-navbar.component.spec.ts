import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('ng-reflect-router-link')).toBe('/');
  });
});
