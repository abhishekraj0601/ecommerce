const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
require('dotenv').config()


const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = process.env.CLIENTS_ID;
const CLIENT_SECRET =process.env.CLIENT_SECRET ;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
REDIRECT_URI);
authClient.setCredentials({refresh_token: REFRESH_TOKEN});


async function mailer(email ,subject,html){
 try{
 const ACCESS_TOKEN = await authClient.getAccessToken();
 const transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
 type: "OAuth2",
 user: "codecrushers01@gmail.com",
 clientId: CLIENT_ID,
 clientSecret: CLIENT_SECRET,
 refreshToken: REFRESH_TOKEN,
 accessToken: ACCESS_TOKEN
 }
 })

 const details = {
    from: "localhost <codecrushers01@gmail.com>",
    to: email,
    subject: subject,
    text: "message text",
    html: html
    }

 const result = await transport.sendMail(details);
 return result;
 }
 catch(err){
 return err;
 }
}

// mailer().then(res => {
//    console.log("sent mail !", res);
// })
module.exports = mailer;