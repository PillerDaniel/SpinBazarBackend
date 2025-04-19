const nodemailer = require("nodemailer");
const config = require("config");

const SITE_EMAIL = config.get("siteEmail");
const SITE_EMAIL_PASSWORD = config.get("siteEmailPassword");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SITE_EMAIL,
    pass: SITE_EMAIL_PASSWORD,
  },
});

const sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: SITE_EMAIL,
    to: userEmail,
    subject: `Welcome to SpinBazar, ${userName}!`,
    html: `
  <div style="background-color: #101828; padding: 30px 0; color: white; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: auto; background: #1a2238; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); text-align: center;">
      <img src="https://i.postimg.cc/qBDbQQmP/Spin-Bazar-Logo.png" alt="SpinBazar Logo" style="width: 120px; margin-bottom: 20px;" />
      <h2 style="color: #ffffff;">Welcome to <span style="color: #D4AF37;">SpinBazar</span>, ${userName} 🎰</h2>
      <p style="font-size: 16px; color: #eee;">We’re thrilled to have you on board!<br/>Get ready for an exciting journey into the world of chance and rewards.</p>
      
      <a href="https://spinbazar.m108.eu/" style="display:inline-block;margin-top:30px;padding:12px 24px;background:#D4AF37;color:#101828;text-decoration:none;border-radius:5px;font-weight:bold;">
        Start Playing
      </a>
    </div>
    <div style="max-width: 600px; margin: auto; text-align: left; margin-top: 10px; color: #bbb; font-size: 12px;">
      <p style="margin-left: 10px;">${new Date().toLocaleDateString(
        "hu-HU"
      )}</p>
    </div>
  </div>
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.log("Error sending email,", error);
  }
};

module.exports = { sendWelcomeEmail };
