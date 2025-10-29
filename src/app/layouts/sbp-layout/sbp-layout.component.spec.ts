import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { SbpLayoutComponent } from './sbp-layout.component';

describe('SbpLayoutComponent', () => {
  let component: SbpLayoutComponent;
  let fixture: ComponentFixture<SbpLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SbpLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply the layout container styling', () => {
    const layoutRoot = fixture.debugElement.query(By.css('div'));
    expect(layoutRoot).toBeTruthy();
    const classList = layoutRoot.nativeElement.classList;
    expect(classList).toContain('flex');
    expect(classList).toContain('h-full');
    expect(classList).toContain('min-h-screen');
    expect(classList).toContain('flex-col');
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });
});
