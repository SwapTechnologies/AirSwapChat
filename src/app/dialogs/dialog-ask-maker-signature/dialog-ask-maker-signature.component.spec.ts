import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAskMakerSignatureComponent } from './dialog-ask-maker-signature.component';

describe('DialogAskMakerSignatureComponent', () => {
  let component: DialogAskMakerSignatureComponent;
  let fixture: ComponentFixture<DialogAskMakerSignatureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogAskMakerSignatureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAskMakerSignatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
