export const environment = {
  production: true,
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
    desiredNetwork: 'Mainnet',
    airswapDexAddress: '0x8fd3121013A07C57f0D69646E86E7a4880b467b7',
    websocketUrl: 'wss://connect.airswap-api.com/websocket' // mainnet
  }
};
