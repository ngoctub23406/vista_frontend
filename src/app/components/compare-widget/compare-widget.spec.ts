import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareWidgetComponent } from './compare-widget';

describe('CompareWidget', () => {
  let component: CompareWidgetComponent;
  let fixture: ComponentFixture<CompareWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompareWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

