const nodemailer = require('nodemailer');

const sendEmail = async (htmlContent, recipient, subjectType) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let subject = `🚀 Daily Learning`;
    if (subjectType === 'last_day') subject = `⚠️ Course Finishing Today!`;
    if (subjectType === 'completed') subject = `🛑 Playlist Completed`;

    await transporter.sendMail({
        from: `"Topic Master" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: subject,
        html: htmlContent
    });
    console.log("✅ Email Sent.");
};

module.exports = { sendEmail };