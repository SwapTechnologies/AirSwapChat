import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private snackBar: MatSnackBar,
    private router: Router,

  ) { }

  showMessage(message: string, buttonText?: string): any {
    if (!buttonText) {
      buttonText = 'OK';
    }
    return this.snackBar.open(message, buttonText, {
      duration: 10000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
  showMessageAndRoute(message: string, route: string): void {
    const snackRef = this.showMessage(message, 'GO TO');
    snackRef.onAction().subscribe(() => {
      this.router.navigate([route]);
    });

  }

}
