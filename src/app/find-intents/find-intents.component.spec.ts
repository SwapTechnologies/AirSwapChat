import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FindIntentsComponent } from './find-intents.component';

describe('FindIntentsComponent', () => {
  let component: FindIntentsComponent;
  let fixture: ComponentFixture<FindIntentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FindIntentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FindIntentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
