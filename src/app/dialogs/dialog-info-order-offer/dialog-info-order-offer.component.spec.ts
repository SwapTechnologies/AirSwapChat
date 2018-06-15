import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogInfoOrderOfferComponent } from './dialog-info-order-offer.component';

describe('DialogInfoOrderOfferComponent', () => {
  let component: DialogInfoOrderOfferComponent;
  let fixture: ComponentFixture<DialogInfoOrderOfferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogInfoOrderOfferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogInfoOrderOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
