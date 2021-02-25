const sgMail = require('@sendgrid/mail');

const sgApiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sgApiKey);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.APP_EMAIL,
        subject: 'Thanks for joining in!',
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    });
};

const sendCancelationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.APP_EMAIL,
        subject: 'Goodbye!',
        text: `Goodbye ${name}. Is there anything that we could have done to kept you on board?`
    });
};

module.exports = {
    sendWelcomeMail: sendWelcomeMail,
    sendCancelationMail: sendCancelationMail
}