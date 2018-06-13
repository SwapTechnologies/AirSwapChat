import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogReauthenticateComponent } from './dialog-reauthenticate.component';

describe('DialogReauthenticateComponent', () => {
  let component: DialogReauthenticateComponent;
  let fixture: ComponentFixture<DialogReauthenticateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogReauthenticateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogReauthenticateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
