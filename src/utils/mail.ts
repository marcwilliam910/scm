import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "5b2faf6a3b30b1",
    pass: "a7c4e5ff9e3cd9",
  },
});

async function sendEmailVerification(email: string, link: string) {
  return transport.sendMail({
    from: "marcwilliamvaliente910@gmail.com ",
    to: email,
    subject: "Verify your email address",
    html: `<p>Click <a href="${link}">here</a> to verify your email address.</p>`,
  });
}

async function sendForgotPassEmail(email: string, link: string) {
  return transport.sendMail({
    from: "marcwilliamvaliente910@gmail.com ",
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
  });
}

async function sendForgotPassSuccessEmail(email: string) {
  return transport.sendMail({
    from: "marcwilliamvaliente910@gmail.com ",
    to: email,
    subject: "Password reset successful",
    html: `<p>Password reset successful. You can now log in with your new password.</p>`,
  });
}

export const mail = {
  sendEmailVerification,
  sendForgotPassEmail,
  sendForgotPassSuccessEmail,
};
