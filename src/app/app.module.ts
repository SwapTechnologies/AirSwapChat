import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule }   from '@angular/forms';

import { ConnectWeb3Service } from './services/connectWeb3.service'
import { WebsocketService } from './services/websocket.service'

import { AppComponent } from './app.component';
import { AccountComponent } from './account/account.component';
import { WebsocketConnectionComponent } from './websocket-connection/websocket-connection.component';
import { SetIntentsComponent } from './set-intents/set-intents.component';

import { RoundPipe } from './pipes/round';
import { FindIntentsComponent } from './find-intents/find-intents.component';
import { MessageSystemComponent } from './message-system/message-system.component';


@NgModule({
  declarations: [
    AppComponent,
    AccountComponent,
    WebsocketConnectionComponent,
    SetIntentsComponent,
    RoundPipe,
    FindIntentsComponent,
    MessageSystemComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [
    ConnectWeb3Service, 
    WebsocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
