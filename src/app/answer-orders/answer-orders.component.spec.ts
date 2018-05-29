import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerOrdersComponent } from './answer-orders.component';

describe('AnswerOrdersComponent', () => {
  let component: AnswerOrdersComponent;
  let fixture: ComponentFixture<AnswerOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnswerOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
