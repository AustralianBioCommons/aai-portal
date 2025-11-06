import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiocommonsNavbarComponent } from './biocommons-navbar.component';

describe('BiocommonsNavbarComponent', () => {
  let component: BiocommonsNavbarComponent;
  let fixture: ComponentFixture<BiocommonsNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiocommonsNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiocommonsNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
