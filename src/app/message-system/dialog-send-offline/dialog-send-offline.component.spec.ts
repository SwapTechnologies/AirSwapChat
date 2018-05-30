import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSendOfflineComponent } from './dialog-send-offline.component';

describe('DialogSendOfflineComponent', () => {
  let component: DialogSendOfflineComponent;
  let fixture: ComponentFixture<DialogSendOfflineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogSendOfflineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogSendOfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
