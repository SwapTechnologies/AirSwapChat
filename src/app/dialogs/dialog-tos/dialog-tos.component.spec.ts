import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTosComponent } from './dialog-tos.component';

describe('DialogTosComponent', () => {
  let component: DialogTosComponent;
  let fixture: ComponentFixture<DialogTosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogTosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
