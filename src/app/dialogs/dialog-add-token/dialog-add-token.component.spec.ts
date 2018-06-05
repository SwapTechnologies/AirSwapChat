import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddTokenComponent } from './dialog-add-token.component';

describe('DialogAddTokenComponent', () => {
  let component: DialogAddTokenComponent;
  let fixture: ComponentFixture<DialogAddTokenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogAddTokenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAddTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
