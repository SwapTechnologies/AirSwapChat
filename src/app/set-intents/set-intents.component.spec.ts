import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetIntentsComponent } from './set-intents.component';

describe('SetIntentsComponent', () => {
  let component: SetIntentsComponent;
  let fixture: ComponentFixture<SetIntentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetIntentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetIntentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
