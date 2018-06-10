import { Component, OnInit, OnDestroy } from '@angular/core';

declare global {
  interface Window {
    web3: any;
    AirSwap: any;
   }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
