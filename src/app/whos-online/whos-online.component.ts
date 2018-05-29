import { Component, OnInit } from '@angular/core';

import {MatTableDataSource} from '@angular/material';

import { WhosOnlineService } from '../services/whos-online.service';

@Component({
  selector: 'app-whos-online',
  templateUrl: './whos-online.component.html',
  styleUrls: ['./whos-online.component.scss']
})
export class WhosOnlineComponent implements OnInit {

  constructor(public whoOnlineService: WhosOnlineService) { }

  ngOnInit() {
  }

}