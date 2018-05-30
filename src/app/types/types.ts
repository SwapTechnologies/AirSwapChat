export type Message = {
  user: string;
  message: string;
  timestamp: number;
}

export type Peer = {
  address: string;
  messageHistory: Message[];
  hasUnreadMessages: boolean;
  isOnline: boolean;
  alias: string;
}

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export type LoggedInUser = {
  address: string;
  alias: string;
}

// export type Order = {
//   makerAddress: string, 
//   makerAmount: string,
//   makerToken: string,
//   takerAddress: string,
//   takerAmount: string, 
//   takerToken: string,
//   expiration: string, 
//   nonce: string, 
//   v: string, 
//   r: string, 
//   s: string
// }