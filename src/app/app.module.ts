//modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { NgMaterialModule } from './ng-material/ng-material.module';
import { RouterModule, Routes } from '@angular/router';

// app components
import { AppComponent } from './app.component';
import { MainframeComponent } from './mainframe/mainframe.component';
import { AccountComponent } from './account/account.component';
import { WebsocketConnectionComponent } from './websocket-connection/websocket-connection.component';
import { SetIntentsComponent } from './set-intents/set-intents.component';
import { FindIntentsComponent } from './find-intents/find-intents.component';
import { GetOrderComponent } from './get-order/get-order.component';
import { AnswerOrdersComponent } from './answer-orders/answer-orders.component';
import { MessageSystemComponent } from './message-system/message-system.component';
import { WhosOnlineComponent } from './whos-online/whos-online.component';

//services
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { ConnectWeb3Service } from './services/connectWeb3.service';
import { FirebaseService } from './services/firebase.service';
import { GetOrderService } from './services/get-order.service';
import { MessagingService } from './services/messaging.service';
import { OrderRequestsService } from './services/order-requests.service';
import { RouterWebsocketActivatedService } from './services/router-websocket-activated.service';
import { WebsocketService } from './services/websocket.service';
import { WhosOnlineService } from './services/whos-online.service';

//pipes
import { RoundPipe } from './pipes/round';

import { environment } from '../environments/environment';
import { InitialPageComponent } from './initial-page/initial-page.component';
import { DialogAddPeerComponent } from './message-system/dialog-add-peer/dialog-add-peer.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { FocusDirective } from './directives/focus.directive';
import { DialogGetOrderComponent } from './find-intents/dialog-get-order/dialog-get-order.component';

const appRoutes: Routes = [
  { path: '', component: InitialPageComponent },
  { path: 'intents', component: SetIntentsComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: 'findPeers', component: FindIntentsComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: 'message', component: MessageSystemComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: 'order', component: GetOrderComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: 'whosOnline', component: WhosOnlineComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: 'answer', component: AnswerOrdersComponent, canActivate:[RouterWebsocketActivatedService] },
  { path: '**', component: InitialPageComponent }
];
// { path: '', redirectTo: '/connect',  pathMatch: 'full' },


@NgModule({
  declarations: [
    AppComponent,
    MainframeComponent,
    AccountComponent,
    WebsocketConnectionComponent,
    SetIntentsComponent,
    FindIntentsComponent,
    GetOrderComponent,
    AnswerOrdersComponent,
    MessageSystemComponent,
    RoundPipe,
    InitialPageComponent,
    DialogAddPeerComponent,
    WhosOnlineComponent,
    AutofocusDirective,
    FocusDirective,
    DialogGetOrderComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    NgMaterialModule,
    AngularFireModule.initializeApp(environment.firebase),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    )
  ],
  providers: [
    AngularFireDatabase,
    ConnectWeb3Service,
    FirebaseService,
    MessagingService,
    GetOrderService,
    OrderRequestsService,
    RouterWebsocketActivatedService,
    WhosOnlineService,
    WebsocketService,
  ],
  entryComponents: [
    DialogAddPeerComponent,
    DialogGetOrderComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
