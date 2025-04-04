import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideMockAuth0Service} from '../../../utils/testingUtils';
import {By} from '@angular/platform-browser';

describe('NavbarComponent when logged in', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideMockAuth0Service({isAuthenticated: true}),
        provideHttpClient(),
        provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Should display Dashboard nav', () => {
    const navDe = fixture.debugElement;
    const header = navDe.query(By.css('.text-2xl'))
    expect(header.nativeElement.textContent).toContain('Dashboard');
  })
});
describe('NavbarComponent when logged out', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideMockAuth0Service({isAuthenticated: false}),
        provideHttpClient(),
        provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ask to log in', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')!.textContent).toMatch('Please log in to continue');
  });
});
