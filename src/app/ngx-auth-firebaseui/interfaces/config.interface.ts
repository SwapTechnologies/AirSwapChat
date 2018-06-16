import { auth } from 'firebase/app';
import GoogleAuthProvider = auth.GoogleAuthProvider;
import FacebookAuthProvider = auth.FacebookAuthProvider;
import TwitterAuthProvider = auth.TwitterAuthProvider;
import GithubAuthProvider = auth.GithubAuthProvider;
import AuthProvider = auth.AuthProvider;

export interface INgxAuthFirebaseUIConfig {
  authNextURL?: string;
  authMethod?: string; // popup or redirect
  authProviders?: Array<AuthProvider>;
  languageCode?: string; // todo: 28.3.18
  onlyEmailPasswordAuth?: boolean;
  onlyProvidersAuth?: boolean;
  toastMessageOnAuthSuccess?: boolean;
  toastMessageOnAuthError?: boolean;
  toastMessageThenEmitSuccessEvent?: boolean;
  toastMessageThenEmitErrorEvent?: boolean;
}

export const defaultAuthFirebaseUIConfig: INgxAuthFirebaseUIConfig = {
  authMethod: 'redirect',
  authProviders: [new GoogleAuthProvider(), new FacebookAuthProvider(), new TwitterAuthProvider(), new GithubAuthProvider()],
  onlyEmailPasswordAuth: false,
  onlyProvidersAuth: false,
  toastMessageOnAuthSuccess: true,
  toastMessageOnAuthError: true,
  toastMessageThenEmitSuccessEvent: true,
  toastMessageThenEmitErrorEvent: false,
};

