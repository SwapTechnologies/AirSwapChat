// modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgMaterialModule } from './ng-material/ng-material.module';
import { RouterModule, Routes } from '@angular/router';

// Firebase
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth, AngularFireAuthModule } from 'angularfire2/auth';
import { NgxAuthFirebaseUIModule } from './ngx-auth-firebaseui/ngx-auth-firebase-u-i.module';

// app components
import { AccountComponent } from './account/account.component';
import { AnswerOrdersComponent } from './answer-orders/answer-orders.component';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { FindIntentsComponent } from './find-intents/find-intents.component';
import { GetOrderDirectComponent } from './get-order-direct/get-order-direct.component';
import { InitialPageComponent } from './initial-page/initial-page.component';
import { MainframeComponent } from './mainframe/mainframe.component';
import { MessageSystemComponent } from './message-system/message-system.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { SetIntentsComponent } from './set-intents/set-intents.component';
import { WhosOnlineComponent } from './whos-online/whos-online.component';

// services
import { ConnectWeb3Service } from './services/connectWeb3.service';
import { ConnectionService } from './services/connection.service';
import { ColumnSpaceObserverService } from './services/column-space-observer.service';
import { FirebaseService } from './services/firebase.service';
import { TakerOrderService } from './services/taker-order.service';
import { MessagingService } from './services/messaging.service';
import { MakerOrderService } from './services/maker-order.service';
import { PriceInfoService } from './services/price-info.service';
import { RouterWebsocketActivatedService } from './services/router-websocket-activated.service';
import { TokenService } from './services/token.service';
import { UserOnlineService } from './services/user-online.service';
import { WebsocketService } from './services/websocket.service';

// pipes
import { RoundPipe } from './pipes/round';
import { CallbackPipe } from './pipes/callback';

// dialogs
import { DialogAddPeerComponent } from './message-system/dialog-add-peer/dialog-add-peer.component';
import { DialogAddTokenComponent } from './dialogs/dialog-add-token/dialog-add-token.component';
import { DialogGetOrderComponent } from './dialogs/dialog-get-order/dialog-get-order.component';
import { DialogInfoDealSealComponent } from './dialogs/dialog-info-deal-seal/dialog-info-deal-seal.component';
import { DialogInfoOrderOfferComponent } from './dialogs/dialog-info-order-offer/dialog-info-order-offer.component';
import { DialogReauthenticateComponent } from './dialogs/dialog-reauthenticate/dialog-reauthenticate.component';
import { DialogSendOfflineComponent } from './message-system/dialog-send-offline/dialog-send-offline.component';
import { DialogTosComponent } from './dialogs/dialog-tos/dialog-tos.component';
import { DialogYesNoComponent } from './dialogs/dialog-yes-no/dialog-yes-no.component';
import { DonateComponent } from './donate/donate.component';
import { AboutComponent } from './about/about.component';
import { DialogAskMakerSignatureComponent } from './dialogs/dialog-ask-maker-signature/dialog-ask-maker-signature.component';

import { environment } from '../environments/environment';

// directives
import { AutofocusDirective } from './directives/autofocus.directive';
import { FocusDirective } from './directives/focus.directive';

const appRoutes: Routes = [
  { path: '', component: FindIntentsComponent },
  { path: 'intents', component: SetIntentsComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'findPeers', component: FindIntentsComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'message', component: MessageSystemComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'whosOnline', component: WhosOnlineComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'answer', component: AnswerOrdersComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'myAccount', component: MyAccountComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'getOrder', component: GetOrderDirectComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'error', component: ErrorComponent},
  { path: '**', redirectTo: '' }
];

// const emailCustomConfig: AuthProviderWithCustomConfig = {
//   provider: AuthProvider.Password,
//   customConfig: {
//     requireDisplayName: true
//   }
// };

// const firebaseUiAuthConfig: FirebaseUIAuthConfig = {
//   providers: [
//     emailCustomConfig,
//   ],
//   method: AuthMethods.Popup,
//   credentialHelper: CredentialHelper.OneTap,
// };

// tos: 'tos',
@NgModule({
  declarations: [
    AccountComponent,
    AppComponent,
    CallbackPipe,
    MainframeComponent,
    SetIntentsComponent,
    FindIntentsComponent,
    AnswerOrdersComponent,
    MessageSystemComponent,
    RoundPipe,
    InitialPageComponent,
    DialogAddPeerComponent,
    WhosOnlineComponent,
    AutofocusDirective,
    FocusDirective,
    DialogGetOrderComponent,
    DialogSendOfflineComponent,
    ErrorComponent,
    DialogAddTokenComponent,
    MyAccountComponent,
    DialogInfoDealSealComponent,
    DialogYesNoComponent,
    GetOrderDirectComponent,
    DialogReauthenticateComponent,
    DialogInfoOrderOfferComponent,
    DialogTosComponent,
    AboutComponent,
    DonateComponent,
    DialogAskMakerSignatureComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    FlexLayoutModule,
    NgMaterialModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    ),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    NgxAuthFirebaseUIModule.forRoot(environment.firebase),
  ],
  providers: [
    AngularFireDatabase,
    AngularFireAuth,
    ColumnSpaceObserverService,
    ConnectWeb3Service,
    ConnectionService,
    FirebaseService,
    MakerOrderService,
    MessagingService,
    PriceInfoService,
    RouterWebsocketActivatedService,
    TakerOrderService,
    TokenService,
    UserOnlineService,
    WebsocketService,
  ],
  entryComponents: [
    DialogAddPeerComponent,
    DialogAddTokenComponent,
    DialogGetOrderComponent,
    DialogInfoDealSealComponent,
    DialogInfoOrderOfferComponent,
    DialogReauthenticateComponent,
    DialogSendOfflineComponent,
    DialogTosComponent,
    DialogYesNoComponent,
    DialogAskMakerSignatureComponent,
    DonateComponent,
    AboutComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
