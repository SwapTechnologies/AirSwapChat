"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
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
// Your company name to include in the emails
// TODO: Change this to your app or company name to customize the email sent.
const APP_NAME = 'AirSwapChat';
admin.initializeApp();
exports.notifyOnOfflineMessage = functions.database.ref('/messaging/{uid}/unreceivedMessage/{timestamp}')
    .onCreate((snap, context) => {
    const { uid } = context.params;
    const snapshot = snap.val();
    if (!snapshot) {
        return Promise.resolve()
            .then(() => { console.log('notifyOnOfflineMessage was called with an empty snapshot?'); });
    }
    const currentTime = Date.now();
    return admin.firestore().collection('users').doc(uid).get()
        .then(user => {
        const userData = user.data();
        if (!userData.email) {
            throw new Error('Email of' + uid + 'not found.');
        }
        else if (!userData.wantMessageNotification) {
            return Promise.resolve();
        }
        else if (currentTime < userData.lastEmailSent + 86400000) {
            return Promise.resolve();
        }
        else {
            // Use nodemailer to send email
            const mailOptions = {
                from: `${APP_NAME} <noreply@airswapchat.com>`,
                to: userData.email,
            };
            // The user subscribed to the newsletter.
            mailOptions['subject'] = `You have a new offline message on ${APP_NAME}!`;
            mailOptions['text'] = `Hey ${userData.displayName || ''}!\n\nYou have a new offline message! Go to ${APP_NAME}.com to read it. \nIt will be burnt after reading.\n\n\nBest regards\nAirSwapChat\n\n\n(This email is automatically generated. If you don't want to receive it anymore, go to login at airswapchat.com and turn it off in your account options.)`;
            admin.firestore().collection('users').doc(uid)
                .update({ 'lastEmailSent': currentTime })
                .catch(err => {
                console.log('Error while trying to set the lastEmailSent time for ', uid, err);
            });
            return mailTransport.sendMail(mailOptions).then(() => {
                console.log('Notified user:', userData.email);
            });
        }
    })
        .catch(err => {
        console.error(err);
    });
});
//# sourceMappingURL=index.js.map