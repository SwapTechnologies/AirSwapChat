import { Component, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthProcessService, AuthProvider } from '../../services/auth-process.service';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';
import { DialogTosComponent } from '../../../dialogs/dialog-tos/dialog-tos.component';
import { MatDialog } from '@angular/material';
import { NotificationService } from '../../../services/notification.service';

export const EMAIL_REGEX = new RegExp(['^(([^<>()[\\]\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\.,;:\\s@\"]+)*)',
  '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
  '[0-9]{1,3}\])|(([a-zA-Z\\-0-9]+\\.)+',
  '[a-zA-Z]{2,}))$'].join(''));

export const PHONE_NUMBER_REGEX = new RegExp(/^\+(?:[0-9] ?){6,14}[0-9]$/);

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngx-auth-firebaseui',
  templateUrl: 'auth.component.html',
  styleUrls: ['auth.component.scss']
})

export class AuthComponent implements OnInit, OnDestroy {

  @Input()
  providers: string[];

  @Input()
  guestEnabled = true;

  // tslint:disable-next-line:no-output-on-prefix
  @Output()
  onSuccess: any;

  // tslint:disable-next-line:no-output-on-prefix
  @Output()
  onError: any;

  authProvider = AuthProvider;
  passwordResetWished: any;

  public signInFormGroup: FormGroup;
  public signUpFormGroup: FormGroup;
  public resetPasswordFormGroup: FormGroup;

  onErrorSubscription: Subscription;
  authenticationError = false;

  passReset = false;

  authProviders = AuthProvider;

  signInEmailFormControl: AbstractControl;
  sigInPasswordFormControl: AbstractControl;

  sigUpNameFormControl: AbstractControl;
  sigUpEmailFormControl: AbstractControl;
  sigUpPasswordFormControl: AbstractControl;
  sigUpPasswordConfirmationFormControl: AbstractControl;
  resetPasswordEmailFormControl: AbstractControl;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
              public auth: AngularFireAuth,
              public authProcess: AuthProcessService,
              private _dialog: MatDialog,
              private notificationService: NotificationService,
              private _formBuilder: FormBuilder,
              private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer) {
    _iconRegistry
      .addSvgIcon('google',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/google.svg'))
      .addSvgIcon('google-colored',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/google.svg'))
      .addSvgIcon('facebook',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/facebook.svg'))
      .addSvgIcon('twitter',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/twitter.svg'))
      .addSvgIcon('github',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/github-circle.svg'))
      .addSvgIcon('phone',
        _sanitizer.bypassSecurityTrustResourceUrl('/assets/phone.svg'));

    this.onSuccess = authProcess.onSuccessEmitter;
    this.onError = authProcess.onErrorEmitter;
  }

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.onErrorSubscription = this.onError.subscribe(() => this.authenticationError = true);
    }
    this._initSignInFormGroupBuilder();
    this._initSignUpFormGroupBuilder();
    this._initResetPasswordFormGroupBuilder();
  }

  public ngOnDestroy(): void {
    if (this.onErrorSubscription) {
      this.onErrorSubscription.unsubscribe();
    }
  }


  get color(): string {
    return this.authenticationError ? 'warn' : 'primary';
  }

  public resetPassword() {
    console.log('PasswordResetEmail sent');
    this.authProcess.resetPassword(this.resetPasswordEmailFormControl.value)
      .then(() => this.passReset = true);
  }

  private _initSignInFormGroupBuilder() {
    this.signInFormGroup = new FormGroup({});
    this.signInFormGroup.registerControl('email', this.signInEmailFormControl = new FormControl('',
      [
        Validators.required,
        Validators.pattern(EMAIL_REGEX)
      ]));
    this.signInFormGroup.registerControl('password', this.sigInPasswordFormControl = new FormControl('',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(25),
      ]));
  }

  private _initSignUpFormGroupBuilder() {
    this.signUpFormGroup = new FormGroup({
      name: this.sigUpNameFormControl = new FormControl('',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
        ]),
      email: this.sigUpEmailFormControl = new FormControl('',
        [
          Validators.required,
          Validators.pattern(EMAIL_REGEX)
        ]),
      password: this.sigUpPasswordFormControl = new FormControl('',
        [
          Validators.required,
          Validators.minLength(6),
        ])
    });
  }

  private _initResetPasswordFormGroupBuilder() {
    this.resetPasswordFormGroup = new FormGroup({
      email: this.resetPasswordEmailFormControl = new FormControl('',
        [
          Validators.required,
          Validators.pattern(EMAIL_REGEX)
        ])
    });
  }

  public pressRegister(name, email, password): Promise<any> {
    const dialogRef = this._dialog.open(DialogTosComponent, {
      // height: '70vh',
      disableClose: true,
      data: { showConsent: true }
    });
    return dialogRef.afterClosed().toPromise()
    .then((checkMarks) => {
      if (!checkMarks.consent) {
        throw new Error('Aborted registration.');
      }
      this.authProcess.signUp(name, email, password, checkMarks.emailNotifications);
    }).catch(err => {
      this.notificationService.showMessage(err.message);
    });

  }
}
