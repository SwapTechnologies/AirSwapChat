import { Token } from '../types/types';

export const validatedTokens: Token[] = [
  {
      'address': '0xcc1cbd4f67cceb7c001bd4adf98451237a193ff8',
      'name': 'AirSwap',
      'symbol': 'AST',
      'decimals': 4,
  },
  {
      'address': '0x0000000000000000000000000000000000000000',
      'name': 'Ether',
      'symbol': 'ETH',
      'decimals': 18,
  },
  {
      'address': '0xbaEd6c1F8Cd4A443Cc372fd15D770e3764B4B2E7'.toLowerCase(),
      'name': '0x',
      'symbol': 'ZRX',
      'decimals': 18,
  },
  {
      'address': '0xf2a8C910676dB689BfD8a3735126B608BDc0D454'.toLowerCase(),
      'name': 'Kyber',
      'symbol': 'KNC',
      'decimals': 18,
  },
];

  // export const EthereumTokens: any[] = [
//   {
//     "address": "0xd0d6d6c5fe4a677d343cc433536bb717bae167dd",
//     "name": "adToken",
//     "symbol": "ADT",
//     "decimals": "9",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/adtoken/",
//     "labels": [
//       "advertising"
//     ],
//   },
//   {
//     "address": "0x27054b13b1b798b345b591a4d22e6562d47ea75a",
//     "name": "AirSwap",
//     "symbol": "AST",
//     "decimals": "4",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/airswap/",
//     "labels": [
//       "trading"
//     ],
//   },
//   {
//     "address": "0x0d88ed6e74bbfd96b831231638b66c05571e824f",
//     "name": "Aventus",
//     "symbol": "AVT",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/aventus/",
//     "labels": [
//       "tickets",
//       "events"
//     ]
//   },
//   {
//     "address": "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
//     "name": "Basic Attention Token",
//     "symbol": "BAT",
//     "decimals": "18",
//     "labels": [
//       "advertising",
//       "attention"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/basic-attention-token/"
//   },
//   {
//     "address": "0x1c4481750daa5ff521a2a7490d9981ed46465dbd",
//     "name": "Blockmason",
//     "symbol": "BCPT",
//     "decimals": "18",
//     "labels": [
//       "credit"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/blockmason/"
//   },
//   {
//     "address": "0x340d2bde5eb28c1eed91b2f790723e3b160613b7",
//     "name": "BLOCKv Token",
//     "symbol": "VEE",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/blockv/"
//   },
//   {
//     "address": "0x558ec3152e2eb2174905cd19aea4e34a23de9ad6",
//     "name": "Bread",
//     "symbol": "BRD",
//     "decimals": "18",
//     "labels": [
//       "wallet"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/bread/"
//   },
//   {
//     "address": "0xd4c435f5b09f855c3317c8524cb1f586e42795fa",
//     "name": "Cindicator",
//     "symbol": "CND",
//     "decimals": "18",
//     "labels": [
//       "analytics",
//       "ai"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/cindicator/"
//   },
//   {
//     "address": "0xbf2179859fc6d5bee9bf9158632dc51678a4100e",
//     "name": "Aelf",
//     "symbol": "ELF",
//     "decimals": "18",
//     "labels": [
//       "infrastructure"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/aelf/"
//   },
//   {
//     "address": "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
//     "name": "Dai Stablecoin v1.0",
//     "symbol": "DAI",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/dai/"
//   },
//   {
//     "address": "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a",
//     "name": "DigixDAO",
//     "symbol": "DGD",
//     "decimals": "9",
//     "labels": [
//       "dao"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/digixdao/"
//   },
//   {
//     "address": "0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0",
//     "name": "EOS",
//     "symbol": "EOS",
//     "decimals": "18",
//     "labels": [
//       "infrastructure"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/eos/"
//   },
//   {
//     "address": "0x7e9e431a0b8c4d532c745b1043c7fa29a48d4fba",
//     "name": "eosDAC",
//     "symbol": "eosDAC",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/eosdac/"
//   },
//   {
//     "address": "0x0000000000000000000000000000000000000000",
//     "name": "Ether",
//     "marketplaceHide": true,
//     "symbol": "ETH",
//     "faucet": "",
//     "decimals": "18",
//     "maxValue": 1000000,
//     "coinMarketCap": "https://coinmarketcap.com/currencies/ethereum/"
//   },
//   {
//     "address": "0x5af2be193a6abca9c8817001f45744777db30756",
//     "name": "Ethos",
//     "symbol": "ETHOS",
//     "decimals": "8",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/ethos/"
//   },
//   {
//     "address": "0x419d0d8bdd9af5e606ae2232ed285aff190e711b",
//     "name": "FunFair",
//     "symbol": "FUN",
//     "decimals": "8",
//     "labels": [
//       "gaming"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/funfair/"
//   },
//   {
//     "address": "0x6810e776880c02933d47db1b9fc05908e5386b96",
//     "name": "Gnosis",
//     "symbol": "GNO",
//     "decimals": "18",
//     "labels": [
//       "predictions",
//       "trading"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/gnosis-gno/"
//   },
//   {
//     "address": "0x12b19d3e2ccc14da04fae33e63652ce469b3f2fd",
//     "name": "Grid",
//     "symbol": "GRID",
//     "decimals": "12",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/grid/"
//   },
//   {
//     "address": "0x6c6ee5e31d828de241282b9606c8e98ea48526e2",
//     "name": "Holo",
//     "symbol": "HOT",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/holo/"
//   },
//   {
//     "address": "0x888666ca69e0f178ded6d75b5726cee99a87d698",
//     "name": "Iconomi",
//     "symbol": "ICN",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/iconomi/"
//   },
//   {
//     "address": "0xb5a5f22694352c15b00323844ad545abb2b11028",
//     "name": "ICON",
//     "symbol": "ICX",
//     "decimals": "18",
//     "labels": [
//       "assets"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/icon/"
//   },
//   {
//     "address": "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
//     "name": "Kyber",
//     "symbol": "KNC",
//     "decimals": "18",
//     "labels": [
//       "trading"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/kyber-network/"
//   },
//   {
//     "address": "0x957c30ab0426e0c93cd8241e2c60392d08c6ac8e",
//     "name": "Modum",
//     "symbol": "MOD",
//     "decimals": "0",
//     "labels": [
//       "supply chain"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/modum/"
//   },
//   {
//     "address": "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
//     "name": "OmiseGO",
//     "symbol": "OMG",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/omisego/"
//   },
//   {
//     "address": "0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a",
//     "name": "Populous",
//     "symbol": "PPT",
//     "decimals": "8",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/populous/"
//   },
//   {
//     "address": "0xe94327d07fc17907b4db788e5adf2ed424addff6",
//     "name": "Augur",
//     "symbol": "REP",
//     "decimals": "18",
//     "labels": [
//       "predictions"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/augur/"
//   },
//   {
//     "address": "0x168296bb09e24a88805cb9c33356536b980d3fc5",
//     "name": "RChain",
//     "symbol": "RHOC",
//     "decimals": "8",
//     "labels": [
//       "apps"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/rchain/"
//   },
//   {
//     "address": "0x408e41876cccdc0f92210600ef50372656052a38",
//     "name": "Republic Token",
//     "symbol": "REN",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/republic-protocol/"
//   },
//   {
//     "address": "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
//     "name": "Status",
//     "symbol": "SNT",
//     "decimals": "18",
//     "labels": [
//       "social"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/status/"
//   },
//   {
//     "address": "0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433",
//     "name": "Storm",
//     "symbol": "STORM",
//     "decimals": "18",
//     "labels": [
//       "gaming"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/storm/"
//   },
//   {
//     "address": "0xd850942ef8811f2a866692a623011bde52a462c1",
//     "name": "VeChain",
//     "symbol": "VEN",
//     "decimals": "18",
//     "labels": [
//       "enterprise"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/vechain/"
//   },
//   {
//     "address": "0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74",
//     "name": "Waltonchain",
//     "symbol": "WTC",
//     "decimals": "18",
//     "labels": [
//       "iot"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/waltonchain/"
//   },
//   {
//     "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//     "name": "W-ETH",
//     "marketplaceHide": true,
//     "symbol": "WETH",
//     "decimals": "18",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/weth/"
//   },
//   {
//     "address": "0xe41d2489571d322189246dafa5ebde1f4699f498",
//     "name": "0x",
//     "symbol": "ZRX",
//     "decimals": "18",
//     "labels": [
//       "trading"
//     ],
//     "coinMarketCap": "https://coinmarketcap.com/currencies/0x/"
//   },
//   {
//     "address": "0x4470bb87d77b963a013db939be332f927f2b992e",
//     "name": "AdEx",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/adx-net/",
//     "decimals": "4",
//     "labels": ["advertising"],
//     "symbol": "ADX"
//   },
//   {
//     "address": "0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d",
//     "name": "Aeternity",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/aeternity/",
//     "decimals": "18",
//     "labels": ["apps", "infrastructure"],
//     "symbol": "AE"
//   },
//   {
//     "address": "0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466",
//     "name": "Aion",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/aion/",
//     "decimals": "8",
//     "labels": ["infrastructure", "services"],
//     "symbol": "AION"
//   },
//   {
//     "address": "0x960b236a07cf122663c4303350609a66a7b288c0",
//     "name": "Aragon",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/aragon/",
//     "decimals": "18",
//     "labels": ["dao", "services"],
//     "symbol": "ANT"
//   },
//   {
//     "address": "0x1a7a8bd9106f2b8d977e08582dc7d24c723ab0db",
//     "name": "AppCoins",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/appcoins/",
//     "decimals": "18",
//     "labels": ["apps", "advertising"],
//     "symbol": "APPC"
//   },
//   {
//     "address": "0x5732046a883704404f284ce41ffadd5b007fd668",
//     "name": "Bluzelle",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/bluzelle/",
//     "decimals": "18",
//     "labels": ["storage"],
//     "symbol": "BLZ"
//   },
//   {
//     "address": "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
//     "name": "Bancor",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/bancor/",
//     "decimals": "18",
//     "labels": ["trading"],
//     "symbol": "BNT"
//   },
//   {
//     "address": "0xd2d6158683aee4cc838067727209a0aaf4359de3",
//     "name": "Bounty0x",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/bounty0x/",
//     "decimals": "18",
//     "labels": ["services", "apps"],
//     "symbol": "BNTY"
//   },
//   {
//     "address": "0x41e5560054824ea6b0732e656e3ad64e20e94e45",
//     "name": "Civic",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/civic/",
//     "decimals": "8",
//     "labels": ["services", "credit"],
//     "symbol": "CVC"
//   },
//   {
//     "address": "0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
//     "name": "Edgeless",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/edgeless/",
//     "decimals": "0",
//     "labels": ["gaming"],
//     "symbol": "EDG"
//   },
//   {
//     "address": "0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4",
//     "name": "Enigma",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/enigma-project/",
//     "decimals": "8",
//     "labels": ["infrastructure"],
//     "symbol": "ENG"
//   },
//   {
//     "address": "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
//     "name": "Enjin Coin",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/enjin-coin/",
//     "decimals": "18",
//     "labels": ["gaming", "apps"],
//     "symbol": "ENJ"
//   },
//   {
//     "address": "0xa74476443119a942de498590fe1f2454d7d4ac0d",
//     "name": "Golem",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/golem-network-tokens/",
//     "decimals": "18",
//     "labels": ["predictions", "services"],
//     "symbol": "GNT"
//   },
//   {
//     "address": "0xc5bbae50781be1669306b9e001eff57a2957b09d",
//     "name": "Gifto",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/gifto/",
//     "decimals": "5",
//     "labels": ["social", "gaming", "apps"],
//     "symbol": "GTO"
//   },
//   {
//     "address": "0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab",
//     "name": "IOSToken",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/iostoken/",
//     "decimals": "18",
//     "labels": ["iot", "services", "infrastructure"],
//     "symbol": "IOST"
//   },
//   {
//     "address": "0x514910771af9ca656af840dff83e8264ecf986ca",
//     "name": "ChainLink",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/chainlink/",
//     "decimals": "18",
//     "labels": ["infrastructure", "services"],
//     "symbol": "LINK"
//   },
//   {
//     "address": "0xef68e7c694f40c8202821edf525de3782458639f",
//     "name": "Loopring",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/loopring/",
//     "decimals": "18",
//     "labels": ["trading"],
//     "symbol": "LRC"
//   },
//   {
//     "address": "0xb97048628db6b661d4c2aa833e95dbe1a905b280",
//     "name": "TenX",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/tenx/",
//     "decimals": "18",
//     "labels": ["payments"],
//     "symbol": "PAY"
//   },
//   {
//     "address": "0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195",
//     "name": "Po.et",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/poet/",
//     "decimals": "8",
//     "labels": ["services"],
//     "symbol": "POE"
//   },
//   {
//     "address": "0x595832f8fc6bf59c85c527fec3740a1b7a361269",
//     "name": "Power Ledger",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/power-ledger/",
//     "decimals": "6",
//     "labels": ["enterprise"],
//     "symbol": "POWR"
//   },
//   {
//     "address": "0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
//     "name": "Ripio Credit Network",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/ripio-credit-network/",
//     "decimals": "18",
//     "labels": ["credit"],
//     "symbol": "RCN"
//   },
//   {
//     "address": "0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6",
//     "name": "Raiden Network Token",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/raiden-network-token/",
//     "decimals": "18",
//     "labels": ["infrastructure", "payments"],
//     "symbol": "RDN"
//   },
//   {
//     "address": "0x8f8221afbb33998d8584a2b05749ba73c37a938a",
//     "name": "Request Network",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/request-network/",
//     "decimals": "18",
//     "labels": ["payments", "credit", "services"],
//     "symbol": "REQ"
//   },
//   {
//     "address": "0x4156d3342d5c385a87d264f90653733592000581",
//     "name": "SALT",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/salt/",
//     "decimals": "8",
//     "labels": ["credit", "services"],
//     "symbol": "SALT"
//   },
//   {
//     "address": "0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009",
//     "name": "SingularDTV",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/singulardtv/",
//     "decimals": "0",
//     "labels": ["services", "apps"],
//     "symbol": "SNGLS"
//   },
//   {
//     "address": "0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a",
//     "name": "Substratum",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/substratum/",
//     "decimals": "2",
//     "labels": ["services"],
//     "symbol": "SUB"
//   },
//   {
//     "address": "0x39bb259f66e1c59d5abef88375979b4d20d98022",
//     "name": "WAX",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/wax/",
//     "decimals": "8",
//     "labels": ["gaming"],
//     "symbol": "WAX"
//   },
//   {
//     "address": "0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27",
//     "name": "Zilliqa",
//     "coinMarketCap": "https://coinmarketcap.com/currencies/zilliqa/",
//     "decimals": "12",
//     "labels": ["infrastructure"],
//     "symbol": "ZIL"
//   }
// ]
