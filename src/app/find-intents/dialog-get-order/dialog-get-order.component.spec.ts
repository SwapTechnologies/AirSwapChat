import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGetOrderComponent } from './dialog-get-order.component';

describe('DialogGetOrderComponent', () => {
  let component: DialogGetOrderComponent;
  let fixture: ComponentFixture<DialogGetOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogGetOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogGetOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
