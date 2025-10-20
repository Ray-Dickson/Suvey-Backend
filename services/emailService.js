const { sendEmail } = require('../config/email');

const sendSurveyCompletionEmail = async (surveyTitle, respondentEmail, surveyUrl) => {
    const subject = `Thank you for completing "${surveyTitle}"`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for your participation!</h2>
            <p>We appreciate you taking the time to complete the survey: <strong>${surveyTitle}</strong></p>
            <p>Your responses have been recorded and will help us improve our services.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    `;

    return await sendEmail(respondentEmail, subject, html);
};

const sendSurveyCreatedEmail = async (surveyTitle, creatorEmail, surveyUrl) => {
    const subject = `Survey "${surveyTitle}" has been created successfully`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Survey Created Successfully!</h2>
            <p>Your survey <strong>"${surveyTitle}"</strong> has been created and is now ready to collect responses.</p>
            <p>Survey URL: <a href="${surveyUrl}" style="color: #007bff;">${surveyUrl}</a></p>
            <p>You can manage your survey and view responses from your dashboard.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    `;

    return await sendEmail(creatorEmail, subject, html);
};

const sendNewResponseNotification = async (surveyTitle, creatorEmail, responseCount) => {
    const subject = `New response received for "${surveyTitle}"`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Survey Response!</h2>
            <p>You have received a new response for your survey: <strong>"${surveyTitle}"</strong></p>
            <p>Total responses: <strong>${responseCount}</strong></p>
            <p>Log in to your dashboard to view the new response and analytics.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    `;

    return await sendEmail(creatorEmail, subject, html);
};

module.exports = {
    sendSurveyCompletionEmail,
    sendSurveyCreatedEmail,
    sendNewResponseNotification
};
