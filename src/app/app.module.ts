// modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgMaterialModule } from './ng-material/ng-material.module';
import { RouterModule, Routes, CanActivate } from '@angular/router';
import { AngularFireAuthModule } from 'angularfire2/auth';
import {
  AuthMethods,
  AuthProvider,
  AuthProviderWithCustomConfig,
  CredentialHelper,
  FirebaseUIAuthConfig,
  FirebaseUIModule
} from 'firebaseui-angular';

// app components
import { AccountComponent } from './account/account.component';
import { AnswerOrdersComponent } from './answer-orders/answer-orders.component';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { FindIntentsComponent } from './find-intents/find-intents.component';
import { GetOrderComponent } from './get-order/get-order.component';
import { InitialPageComponent } from './initial-page/initial-page.component';
import { MainframeComponent } from './mainframe/mainframe.component';
import { MessageSystemComponent } from './message-system/message-system.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { SetIntentsComponent } from './set-intents/set-intents.component';
import { WhosOnlineComponent } from './whos-online/whos-online.component';

// services
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { ConnectWeb3Service } from './services/connectWeb3.service';
import { ColumnSpaceObserverService } from './services/column-space-observer.service';
import { FirebaseService } from './services/firebase.service';
import { GetOrderService } from './services/get-order.service';
import { MessagingService } from './services/messaging.service';
import { OrderRequestsService } from './services/order-requests.service';
import { RouterWebsocketActivatedService } from './services/router-websocket-activated.service';
import { TokenService } from './services/token.service';
import { WebsocketService } from './services/websocket.service';

// pipes
import { RoundPipe } from './pipes/round';
import { CallbackPipe } from './pipes/callback';

// dialogs
import { DialogAddPeerComponent } from './message-system/dialog-add-peer/dialog-add-peer.component';
import { DialogGetOrderComponent } from './dialogs/dialog-get-order/dialog-get-order.component';
import { DialogSendOfflineComponent } from './message-system/dialog-send-offline/dialog-send-offline.component';

import { environment } from '../environments/environment';

// directives
import { AutofocusDirective } from './directives/autofocus.directive';
import { FocusDirective } from './directives/focus.directive';
import { DialogAddTokenComponent } from './dialogs/dialog-add-token/dialog-add-token.component';
import { VerifyUserComponent } from './verify-user/verify-user.component';


const appRoutes: Routes = [
  { path: '', component: FindIntentsComponent },
  { path: 'intents', component: SetIntentsComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'findPeers', component: FindIntentsComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'message', component: MessageSystemComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'order', component: GetOrderComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'whosOnline', component: WhosOnlineComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'answer', component: AnswerOrdersComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'myAccount', component: MyAccountComponent, canActivate: [RouterWebsocketActivatedService] },
  { path: 'error', component: ErrorComponent},
  { path: '**', redirectTo: '' }
];
// { path: '', redirectTo: '/connect',  pathMatch: 'full' },


const facebookCustomConfig: AuthProviderWithCustomConfig = {
  provider: AuthProvider.Facebook,
  customConfig: {
    scopes: [
      'public_profile',
      'email',
      'user_likes',
      'user_friends'
    ],
    customParameters: {
      // Forces password re-entry.
      auth_type: 'reauthenticate'
    }
  }
};

const googleCustomConfig: AuthProviderWithCustomConfig = {
  provider: AuthProvider.Google,
  customConfig: {
    customParameters: {
      prompt: 'select_account'
    }
  }
};


const emailCustomConfig: AuthProviderWithCustomConfig = {
  provider: AuthProvider.Password,
  customConfig: {
    requireDisplayName: true
  }
};

const firebaseUiAuthConfig: FirebaseUIAuthConfig = {
  providers: [
    // googleCustomConfig,
    emailCustomConfig,
    // AuthProvider.Github,
    // AuthProvider.Twitter,
  ],
  method: AuthMethods.Popup,
  tos: '<your-tos-link>',
  credentialHelper: CredentialHelper.OneTap,
};

@NgModule({
  declarations: [
    AccountComponent,
    AppComponent,
    CallbackPipe,
    MainframeComponent,
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
    DialogSendOfflineComponent,
    ErrorComponent,
    DialogAddTokenComponent,
    MyAccountComponent,
    VerifyUserComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FlexLayoutModule,
    NgMaterialModule,
    AngularFireModule.initializeApp(environment.firebase),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    ),
    AngularFireAuthModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig)
  ],
  providers: [
    AngularFireDatabase,
    AngularFireAuth,
    ColumnSpaceObserverService,
    ConnectWeb3Service,
    FirebaseService,
    MessagingService,
    GetOrderService,
    OrderRequestsService,
    RouterWebsocketActivatedService,
    TokenService,
    WebsocketService,
  ],
  entryComponents: [
    DialogAddPeerComponent,
    DialogAddTokenComponent,
    DialogGetOrderComponent,
    DialogSendOfflineComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
