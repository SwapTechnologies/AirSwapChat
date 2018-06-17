import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog, MatSnackBar } from '@angular/material';

import { DialogInfoDealSealComponent } from '../dialogs/dialog-info-deal-seal/dialog-info-deal-seal.component';
import { DialogInfoOrderOfferComponent } from '../dialogs/dialog-info-order-offer/dialog-info-order-offer.component';
import { DialogYesNoComponent } from '../dialogs/dialog-yes-no/dialog-yes-no.component';

// services
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Erc20Service } from '../services/erc20.service';
import { MakerOrderService } from '../services/maker-order.service';
import { TakerOrderService } from '../services/taker-order.service';

interface Order {
  makerAddress: string;
  makerAmount: string;
  makerToken: string;
  takerToken: string;
  takerAddress: string;
}

@Component({
  selector: 'app-answer-orders',
  templateUrl: './answer-orders.component.html',
  styleUrls: ['./answer-orders.component.scss']
})
export class AnswerOrdersComponent implements OnInit, OnDestroy {

  public isOpen = true;
  public orders: Order[] = [];
  public takerAmount: any = {};
  public websocketSubscription: Subscription;
  public openOrderIds: any = {};
  public expiration = 5;
  public timers: any = {};

  public gotOrderRequests = false;
  public gotOrdersToTake = false;
  public gotPendingOrders = false;
  public gotDoneDeals = false;
  public gotAbortedDeals = false;
  public selectedTabIndex: number;

  constructor(
    public columnSpaceObserver: ColumnSpaceObserverService,
    private erc20Service: Erc20Service,
    public takerOrderService: TakerOrderService,
    public makerOrderService: MakerOrderService,
    private web3service: ConnectWeb3Service,
    public dialog: MatDialog,
    public snackbar: MatSnackBar,
  ) { }

  ngOnInit() {
    const a = this.answerOrderRequests;
    const b = this.takeSignedOrders;
    const c = this.pendingOrders;
    const d = this.doneDeals;
    const e = this.abortedDeals;

    if (this.gotOrderRequests) {
      this.selectedTabIndex = 0;
    } else if (this.gotOrdersToTake) {
      this.selectedTabIndex = 1;
    } else if (this.gotPendingOrders) {
      this.selectedTabIndex = 2;
    } else if (this.gotDoneDeals) {
      this.selectedTabIndex = 3;
    } else if (this.abortedDeals) {
      this.selectedTabIndex = 4;
    } else {
      this.selectedTabIndex = null;
    }
  }

  ngOnDestroy() {
    if (this.websocketSubscription) { this.websocketSubscription.unsubscribe(); }
  }

  get answerOrderRequests(): string {
    let baseName = 'Answer Order Requests';
    this.gotOrderRequests = this.makerOrderService.orderRequests.length > 0;
    if (this.gotOrderRequests) {
      baseName = baseName + ' (' + this.makerOrderService.orderRequests.length + ')';
    }
    return baseName;
  }

  get takeSignedOrders(): string {
    let baseName = 'Take Signed Orders';
    this.gotOrdersToTake = this.takerOrderService.orderResponses.length > 0;
    if (this.gotOrdersToTake) {
      baseName = baseName + ' (' + this.takerOrderService.orderResponses.length + ')';
    }
    return baseName;
  }

  get pendingOrders(): string {
    let baseName = 'Pending Orders';
    const sum = this.takerOrderService.pendingOrders.length +
                this.makerOrderService.answeredRequests.length;
    this.gotPendingOrders = sum > 0;
    if (this.gotPendingOrders) {
      baseName = baseName + ' (' + sum + ')';
    }
    return baseName;
  }

  get doneDeals(): string {
    let baseName = 'Done Deals Today';
    const sum = this.makerOrderService.doneDeals.length +
                this.takerOrderService.finishedOrders.length;
    this.gotDoneDeals = sum > 0;
    if (this.gotDoneDeals) {
      baseName = baseName + ' (' + sum + ')';
    }
    return baseName;
  }

  get abortedDeals(): string {
    let baseName = 'Aborted Deals';
    const sum = this.takerOrderService.errorOrders.length +
                this.makerOrderService.errorRequests.length;
    this.gotAbortedDeals = sum > 0;
    if (this.gotAbortedDeals) {
      baseName = baseName + ' (' + sum + ')';
    }
    return baseName;
  }

  takerHasEnough(order: any): boolean {
    return (this.takerAmount[order.id] <=
      (order.takerBalanceTakerToken / order.takerDecimals));
  }

  columnNumber(array): number {
    const columnNum = this.columnSpaceObserver.columnNum;
    const numMessages = array.length;
    return numMessages < 3 ? Math.min(columnNum, numMessages) : columnNum;
  }

  // get columnNumber2(): number {
  //   const columnNum = this.columnSpaceObserver.columnNum;
  //   const numMessages = this.takerOrderService.orderResponses.length;
  //   return numMessages < 3 ? Math.min(columnNum, numMessages) : columnNum;
  // }

  sign_order(order): Promise<any> {
    order['nonce'] = Math.round(Math.random() * 100 * Date.now()).toString();
    order['expiration'] = Math.round(Date.now() / 1000 + this.expiration * 60).toString();
    const hashV = this.web3service.web3.utils.soliditySha3(
      order['makerAddress'],
      order['makerAmount'],
      order['makerToken'],
      order['takerAddress'],
      order['takerAmount'],
      order['takerToken'],
      order['expiration'],
      order['nonce']
    );
    const prefixedHash =
      this.web3service.web3.eth.accounts.hashMessage(hashV);

    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '700px',
      data: {
        text: 'Are you sure you want to sign this deal of your ' +
        order.makerAmount / order.makerDecimals  + ' ' + order.makerProps.symbol +
        ' for peers ' + order.takerAmount / order.takerDecimals  + ' ' + order.takerProps.symbol +
        '? ' +
        'Once the signature is sent, you can not take it back. And your peer has the final decision to seal this deal. With nonce ' +
         order.nonce +
         ' you will have to sign the hash ' + prefixedHash,
        yes: 'DO IT',
        no: 'CANCEL'
      }
    });
    return dialogRef.afterClosed().toPromise()
    .then(result => {
      if (result) {
        return this.web3service.web3.eth.sign(prefixedHash, this.web3service.connectedAccount)
        .then((signedMessage) => {
          let v, r, s;
          r = signedMessage.slice(0, 66);
          s = '0x' + signedMessage.slice(66, 130);
          v = this.web3service.web3.utils.hexToNumber('0x' + signedMessage.slice(130, 132));
          order['v'] = v;
          order['r'] = r;
          order['s'] = s;
          return order;
        });
      }
    });
  }

  answerOrder(order: any): void {
    if (Number(this.takerAmount[order.id]) >= 0 && this.takerHasEnough(order)) {
      order['clickedOfferDeal'] = true;
      order['takerAmount'] = this.erc20Service.toFixed(Math.floor(Number(this.takerAmount[order.id]) * order['takerDecimals']));
      order['makerAmount'] = this.erc20Service.toFixed(order['makerAmount']);
      const uuid = order.id;
      // delete order.id;

      this.sign_order(order)
      .then(fullOrder => {
        this.makerOrderService.answerOrder(fullOrder, () => {
          this.selectedTabIndex = 3;
          this.snackbar.open('Successfully traded with ' + order.alias, 'Ok.', {duration: 3000});
        });
        this.selectedTabIndex = 2;
        this.snackbar.open('Signed and answered the deal with ' + order.alias +
          '. Now it is up to your peer.', 'Ok', {duration: 3000});
      }).catch(error => {
        console.log('Sign aborted.');
        order['clickedOfferDeal'] = false;
      });
    }
  }

  count(obj: any): number {
    return Object.keys(obj).length;
  }

  sealDeal(order: any): void {
    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '700px',
      data: {
        text: 'Are you sure you want to agree to this deal? ' +
        'Once the transaction is sent it can not be reverted.',
        yes: 'DO IT',
        no: 'CANCEL'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        order['clickedDealSeal'] = true;
        this.takerOrderService.sealDeal(order,
          () => {
            this.snackbar.open('Sent signed order to ' + order.alias);
            this.selectedTabIndex = 2;
          },
          () => {
            this.snackbar.open('Successfully traded with ' + order.alias);
            this.selectedTabIndex = 3;
          });
      }
    });
  }

  dealSealDetails(order: any): void {
    const dialogRef = this.dialog.open(DialogInfoDealSealComponent, {
      width: '700px',
      data: order
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sealDeal(order);
      }
    });
  }

  rejectDeal(order: any): void {
    this.takerOrderService.rejectDeal(order, () => {
      if (this.takerOrderService.orderResponses.length === 0) {
        this.selectedTabIndex = 4;
      }
    });
  }

  rejectToOffer(order): void {
    this.makerOrderService.rejectRequest(order);
  }

  detailsForOrderOffer(order): void {
    order['expirationMinutes'] = this.expiration;
    order['takerAmount'] = this.erc20Service.toFixed(Math.floor(Number(this.takerAmount[order.id]) * order['takerDecimals']));

    const dialogRef = this.dialog.open(DialogInfoOrderOfferComponent, {
      width: '700px',
      data: order
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.answerOrder(order);
      }
    });
  }
}
