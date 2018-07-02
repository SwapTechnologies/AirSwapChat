import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';
const Web3 = require('web3');
import { ABI } from './erc20';

// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const APP_NAME = 'AirSwapChat';

admin.initializeApp();

exports.notifyOnOfflineMessage = functions.database.ref('/messaging/{uid}/unreceivedMessage/{timestamp}')
.onCreate((snap, context) => {
  const { uid } = context.params;
  const snapshot = snap.val();
  if (!snapshot) {
    return Promise.resolve()
    .then(()=>{console.log('notifyOnOfflineMessage was called with an empty snapshot?')});
  }
  const currentTime = Date.now();

  return admin.firestore().collection('users').doc(uid).get()
  .then(user => {
    const userData = user.data();
    if(!userData.email) {
      throw new Error('Email of' + uid + 'not found.');
    } else if (!userData.wantMessageNotification) {
      return Promise.resolve();
    } else if (currentTime < userData.lastEmailSent + 86400000) {
      return Promise.resolve();
    } else {
      // Use nodemailer to send email
      const mailOptions = {
        from: `${APP_NAME} <noreply@airswapchat.com>`,
        to: userData.email,
      };


      // The user subscribed to the newsletter.
      mailOptions['subject'] = `You have a new offline message on ${APP_NAME}!`;
      mailOptions['text'] = `Hey ${userData.displayName || ''}!\n\nYou have a new offline message! Go to ${APP_NAME}.com to read it. \nIt will be burnt after reading.\n\n\nBest regards\nAirSwapChat\n\n\n(This email is automatically generated. If you don't want to receive it anymore, go to login at airswapchat.com and turn it off in your account options.)`;
      admin.firestore().collection('users').doc(uid)
      .update({'lastEmailSent': currentTime})
      .catch(err => {
        console.log('Error while trying to set the lastEmailSent time for ', uid, err);
      })
      return mailTransport.sendMail(mailOptions).then(() => {
        console.log('Notified user:', userData.email);
      });
    }
  })
  .catch(err => {
    console.error(err);
  });
})

exports.checkNewToken = functions.firestore.document('/tokens/{tokenAddress}')
.onCreate((snap, context) => {
  const { tokenAddress } = context.params;
  const snapshot = snap.data();
  if (!snapshot) {
    return Promise.resolve()
    .then(()=>{console.log('checkNewToken was called with an empty snapshot?')});
  }

  const validAddress = snapshot.address.toLowerCase() === tokenAddress;

  const web3 = new Web3('https://mainnet.infura.io/506w9CbDQR8fULSDR7H0');
  const contract = new web3.eth.Contract(ABI, tokenAddress);


  let validName = false;
  let validSymbol = false;
  let validDecimals = false;
  let canCheckApproval = false;

  const promiseList = [];
  promiseList.push(
    contract.methods.name().call()
    .then(name => validName = snapshot.name === name)
    .catch(() => validName = false)
  );
  promiseList.push(
    contract.methods.symbol().call()
    .then(symbol => validSymbol = snapshot.symbol === symbol)
    .catch(() => validSymbol = false)
  );
  promiseList.push(
    contract.methods.decimals().call()
    .then(decimals => validDecimals = snapshot.decimals === decimals)
    .catch(() => validDecimals = false)
  );
  promiseList.push(
    contract.methods
    .allowance('0xC7a1b6C071E114C1Cd587182AeC6838a179a0a11', '0x8fd3121013A07C57f0D69646E86E7a4880b467b7')
    .call()
    .then(approvedAmount => canCheckApproval = Number(approvedAmount) >= 0)
    .catch(() => canCheckApproval = false)
  );

  return Promise.all(promiseList)
  .then(() => {
    // check if token entry is conform with the erc20 contract
    if( !(validAddress && validDecimals && validName && validSymbol && canCheckApproval) ) {
      // if not -> delete it from the database
      admin.firestore().collection('tokens').doc(tokenAddress).delete()
      console.log(snapshot.addedBy, 'tried to add a token with wrong entries. Deleted.')
    }
  })
  .catch(err => {
    admin.firestore().collection('tokens').doc(tokenAddress).delete()
    console.error(err, 'Error while checking token ' + tokenAddress, snapshot);
  });
})
