import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhosOnlineComponent } from './whos-online.component';

describe('WhosOnlineComponent', () => {
  let component: WhosOnlineComponent;
  let fixture: ComponentFixture<WhosOnlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhosOnlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhosOnlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
