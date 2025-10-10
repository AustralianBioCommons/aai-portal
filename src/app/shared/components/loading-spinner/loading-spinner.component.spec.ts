import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading spinner with proper accessibility attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('div[role="status"]');
    const svg = compiled.querySelector('svg[aria-hidden="true"]');
    const srText = compiled.querySelector('.sr-only');

    expect(spinner).toBeTruthy();
    expect(svg).toBeTruthy();
    expect(srText?.textContent).toBe('Loading...');
  });

  it('should have proper CSS classes for styling', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg');

    expect(svg?.classList.contains('animate-spin')).toBe(true);
    expect(svg?.classList.contains('fill-biocommons-primary')).toBe(true);
    expect(svg?.classList.contains('text-gray-200')).toBe(true);
  });
});
