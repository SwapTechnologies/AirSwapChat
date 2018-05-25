import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsocketConnectionComponent } from './websocket-connection.component';

describe('WebsocketConnectionComponent', () => {
  let component: WebsocketConnectionComponent;
  let fixture: ComponentFixture<WebsocketConnectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebsocketConnectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsocketConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
