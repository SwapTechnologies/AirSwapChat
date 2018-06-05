export interface Message {
  user: string;
  message: string;
  timestamp: number;
}

export interface StoredMessage {
  uid: string;
  message: string;
  timestamp: number;
}

export interface Peer {
  address: string;
  messageHistory: Message[];
  hasUnreadMessages: boolean;
  isOnline: boolean;
  alias: string;
  uid: string;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface LoggedInUser {
  address: string;
  wsAddress: string;
  alias: string;
  uid: string;
}
export interface OtherUser {
  address: string;
  alias: string;
  uid: string;
}
