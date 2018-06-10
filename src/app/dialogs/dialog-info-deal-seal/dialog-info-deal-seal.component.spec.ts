import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogInfoDealSealComponent } from './dialog-info-deal-seal.component';

describe('DialogInfoDealSealComponent', () => {
  let component: DialogInfoDealSealComponent;
  let fixture: ComponentFixture<DialogInfoDealSealComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogInfoDealSealComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogInfoDealSealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
