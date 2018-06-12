import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetOrderDirectComponent } from './get-order-direct.component';

describe('GetOrderDirectComponent', () => {
  let component: GetOrderDirectComponent;
  let fixture: ComponentFixture<GetOrderDirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GetOrderDirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetOrderDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
