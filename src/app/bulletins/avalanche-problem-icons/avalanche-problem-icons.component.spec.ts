import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvalancheProblemIconsComponent } from './avalanche-problem-icons.component';

describe('AvalancheProblemIconsComponent', () => {
  let component: AvalancheProblemIconsComponent;
  let fixture: ComponentFixture<AvalancheProblemIconsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AvalancheProblemIconsComponent]
    });
    fixture = TestBed.createComponent(AvalancheProblemIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
