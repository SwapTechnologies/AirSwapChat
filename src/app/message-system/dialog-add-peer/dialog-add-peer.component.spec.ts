import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddPeerComponent } from './dialog-add-peer.component';

describe('DialogAddPeerComponent', () => {
  let component: DialogAddPeerComponent;
  let fixture: ComponentFixture<DialogAddPeerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogAddPeerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAddPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
