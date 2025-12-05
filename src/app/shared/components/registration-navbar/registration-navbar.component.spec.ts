import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrationNavbarComponent } from './registration-navbar.component';

describe('RegistrationNavbarComponent', () => {
  let component: RegistrationNavbarComponent;
  let fixture: ComponentFixture<RegistrationNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationNavbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('points logo link to the current host', () => {
    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('href')).toBe(`${window.location.origin}/`);
  });
});
