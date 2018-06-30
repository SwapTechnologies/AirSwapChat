// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBV69Cbiib-VySktArXAzKx7rq9GwjtfiM',
    authDomain: 'airswapchat.firebaseapp.com',
    databaseURL: 'https://airswapchat.firebaseio.com',
    projectId: 'airswapchat',
    storageBucket: 'airswapchat.appspot.com',
    messagingSenderId: '732282521654'
  },
  ethereumNetwork: { // don't forget to also change the list of validated tokens
    // desiredNetwork: 'Rinkeby',
    // airswapDexAddress: '0x08a1d43a218adaf6273f323a1f5a43d930f3d69e',
    // websocketUrl: 'wss://sandbox.airswap-api.com/websocket',
    // etherscanPrefix: 'rinkeby.'
    desiredNetwork: 'Mainnet',
    airswapDexAddress: '0x8fd3121013A07C57f0D69646E86E7a4880b467b7',
    websocketUrl: 'wss://connect.airswap-api.com/websocket', // mainnet
    etherscanPrefix: ''
  }
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
