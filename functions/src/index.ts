import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as postmarkTransport from 'nodemailer-postmark-transport';
import * as admin from 'firebase-admin';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


// 2. Admin SDK can only be initialized once
try {admin.initializeApp(functions.config().firebase)} catch(e) {
        console.log('dbCompaniesOnUpdate initializeApp failure')
}

// 3. Google Cloud environment variable used:
// firebase functions:config:set postmark.key="API-KEY-HERE"
const postmarkKey = functions.config().postmark.key
const mailTransport = nodemailer.createTransport(postmarkTransport({
  auth: {
    apiKey: postmarkKey
  }
}))

// 4. Watch for new users
export const sendMail =
  functions.database.ref('/messaging/{uid}/unreceivedMessage/{timestamp}')
  .onCreate((event) => {
    const snapshot = event.data
    const user = snapshot.val()
    // Use nodemailer to send email
    return sendEmail(user);
  })

function sendEmail(user) {
  // 5. Send welcome email to new users
  const mailOptions = {
          from: '"Dave" <dave@example.net>',
          to: '${user.email}',
          subject: 'Welcome!',
          html: `<YOUR-WELCOME-MESSAGE-HERE>`
  }
  // 6. Process the sending of this email via nodemailer
  return mailTransport.sendMail(mailOptions)
          .then(() => console.log('dbCompaniesOnUpdate:Welcome confirmation email'))
          .catch((error) => console.error('There was an error while sending the email:', error))
}