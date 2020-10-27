import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NcrBindFormsComponent } from './ncr-bind-forms.component';

describe('NcrBindFormsComponent', () => {
  let component: NcrBindFormsComponent;
  let fixture: ComponentFixture<NcrBindFormsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NcrBindFormsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NcrBindFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
