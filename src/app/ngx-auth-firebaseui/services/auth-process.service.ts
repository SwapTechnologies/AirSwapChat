import { EventEmitter, Injectable, SecurityContext } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireAuth } from 'angularfire2/auth';
import { ISignInProcess, ISignUpProcess } from '../interfaces/main.interface';
import { FirestoreSyncService } from './firestore-sync.service';
import { auth, User } from 'firebase/app';
import { DialogTosComponent } from '../../dialogs/dialog-tos/dialog-tos.component';

export enum AuthProvider {
  EmailAndPassword = 'firebase',
}

@Injectable()
export class AuthProcessService implements ISignInProcess, ISignUpProcess {

  onSuccessEmitter: EventEmitter<any> = new EventEmitter<any>();
  onErrorEmitter: EventEmitter<any> = new EventEmitter<any>();
  isLoading: boolean;
  emailConfirmationSent: boolean;
  emailToConfirm: string;

  // tslint:disable-next-line:no-shadowed-variable
  constructor(public auth: AngularFireAuth,
              private _fireStoreService: FirestoreSyncService,
              private _snackBar: MatSnackBar,
              private _dialog: MatDialog,
              private _dom: DomSanitizer) {
  }

  /**
   * Reset the password of the user via email
   *
   * @param email - the email to reset
   * @returns
   */
  public resetPassword(email: string) {
    return this.auth.auth.sendPasswordResetEmail(email)
      .then(() => this._snackBar.open('Email sent.', 'Ok.', {duration: 3000}))
      .catch((error) => this.onErrorEmitter.next(error));
  }

  /**
   * General sign in mechanism to authenticate the users with a firebase project
   * using a traditional way, via username and password or by using an authentication provider
   * like google, facebook, twitter and github
   *
   * @param provider - the provider to authenticate with (google, facebook, twitter, github)
   * @param email - (optional) the email of user - used only for a traditional sign in
   * @param password - (optional) the password of user - used only for a traditional sign in
   * @returns
   */
  public async signInWith(provider: AuthProvider, email?: string, password?: string) {
    try {
      this.isLoading = true;
      let signInResult: auth.UserCredential;

      switch (provider) {
        case AuthProvider.EmailAndPassword:
          signInResult = await this.auth.auth.signInWithEmailAndPassword(email, password) as auth.UserCredential;
          break;

        default:
          throw new Error(`${AuthProvider[provider]} is not available as auth provider`);

      }

      await this._fireStoreService.updateUserData(this.parseUserInfo(signInResult.user));
      this.onSuccessEmitter.next(signInResult.user);
    } catch (err) {
      this._snackBar.open(err.message, 'OK', {duration: 5000});
      this.onErrorEmitter.next(err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Sign up new users via email and password.
   * After that the user should verify and confirm an email sent via the firebase
   *
   * @param name - the name if the new user
   * @param email - the email if the new user
   * @param password - the password if the new user
   * @param dialogContent - String with HTML Code that can be included in the register
   * @returns
   */
  public async signUp(name: string, email: string, password: string, dialogContent?: string) {
    try {
      this.isLoading = true;

      const dialogRef = this._dialog.open(DialogTosComponent, {
        data: { showConsent: true }
      });
      await dialogRef.afterClosed().toPromise()
      .then((accepts) => {
        if (!accepts) {
          throw new Error('Aborted registration.');
        }
      });

      const userCredential: auth.UserCredential = await this.auth.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await this._fireStoreService
        .getUserDocRefByUID(user.uid)
        .set({
          uid: user.uid,
          displayName: name,
          email: user.email,
        } as User);

      await user.sendEmailVerification();
      const updatedProfileResult = await this.updateProfile(name, user.photoURL);
      this.emailConfirmationSent = true;
      this.emailToConfirm = email;
      this.auth.auth.signOut();
      this.onSuccessEmitter.next(user);
    } catch (err) {
      this._snackBar.open(err.message, 'OK', {duration: 5000});
      this.onErrorEmitter.next(err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update the profile (name + photo url) of the authenticated user in the
   * firebase authentication feature (not in firestore)
   *
   * @param name - the new name of the authenticated user
   * @param photoURL - the new photo url of the authenticated user
   * @returns
   */
  public async updateProfile(name: string, photoURL: string): Promise<any> {
    return await this.auth.auth.currentUser.updateProfile({displayName: name, photoURL: photoURL});
  }

  public async deleteAccount(): Promise<any> {
    return await this.auth.auth.currentUser.delete();
  }

  public parseUserInfo(user: User): any {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      providerId: user.providerData.length > 0 ? user.providerData[0].providerId : null
    };
  }
}
