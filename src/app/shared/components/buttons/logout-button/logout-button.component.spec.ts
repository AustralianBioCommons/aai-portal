import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutButtonComponent } from './logout-button.component';
import {provideMockAuth0Service} from '../../../../../utils/testingUtils';
import {provideHttpClient} from '@angular/common/http';
import {By} from '@angular/platform-browser';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;
  let fixture: ComponentFixture<LogoutButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutButtonComponent],
      providers: [provideMockAuth0Service({isAuthenticated: true}), provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoutButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should call logout() on click", () => {
    let logoutFunction = spyOn(component, 'logout');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(logoutFunction).toHaveBeenCalled();
  });
});
