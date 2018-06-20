import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEnterWithoutRegisterComponent } from './dialog-enter-without-register.component';

describe('DialogEnterWithoutRegisterComponent', () => {
  let component: DialogEnterWithoutRegisterComponent;
  let fixture: ComponentFixture<DialogEnterWithoutRegisterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogEnterWithoutRegisterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogEnterWithoutRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
