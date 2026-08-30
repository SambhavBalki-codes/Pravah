export function generateForgotPasswordEmailTemplate(resetPasswordUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Pravah - Password Reset Request</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f8fafc;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
      ">

        <div style="
          max-width: 620px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        ">

          <!-- Header -->
          <div style="
            padding: 28px 40px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            text-align: center;
          ">

            <h1 style="
              margin: 0;
              color: #ffffff;
              font-size: 30px;
              letter-spacing: 1px;
              font-weight: 700;
            ">
              Pravah
            </h1>

            <p style="
              margin: 8px 0 0;
              color: #cbd5e1;
              font-size: 14px;
              letter-spacing: 0.08em;
            ">
              LEARN • MANAGE • GROW
            </p>

          </div>

          <!-- Main Content -->
          <div style="padding: 38px 40px 30px;">

            <h2 style="
              margin: 0 0 18px;
              color: #0f172a;
              font-size: 26px;
              font-weight: 700;
            ">
              Password Reset Request
            </h2>

            <p style="
              margin: 0 0 16px;
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
            ">
              Hello,
            </p>

            <p style="
              margin: 0 0 18px;
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
            ">
              We received a request to reset the password associated with your Pravah account.
            </p>

            <p style="
              margin: 0 0 28px;
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
            ">
              Click the button below to create a new password and continue securely.
            </p>

            <div style="
              text-align: center;
              margin: 30px 0;
            ">
              <a
                href="${resetPasswordUrl}"
                style="
                  display: inline-block;
                  padding: 15px 30px;
                  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 10px;
                  font-size: 15px;
                  font-weight: 700;
                  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
                "
              >
                Reset Password
              </a>
            </div>

            <p style="
              margin: 0 0 10px;
              color: #64748b;
              font-size: 13px;
              line-height: 1.6;
            ">
              If the button above does not work, copy and paste this link into your browser:
            </p>

            <div style="
              padding: 14px 16px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-bottom: 28px;
            ">
              <a
                href="${resetPasswordUrl}"
                style="
                  color: #1e3a8a;
                  font-size: 13px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                ${resetPasswordUrl}
              </a>
            </div>

            <p style="
              margin: 0 0 12px;
              color: #64748b;
              font-size: 14px;
              line-height: 1.6;
            ">
              For your security, this reset link is time-sensitive and should be used promptly.
            </p>

            <p style="
              margin: 0;
              color: #64748b;
              font-size: 14px;
              line-height: 1.6;
            ">
              If you did not request this change, you can safely ignore this email and your account will remain secure.
            </p>

          </div>

          <!-- Footer -->
          <div style="
            padding: 22px 40px 28px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          ">

            <p style="
              margin: 0 0 8px;
              color: #64748b;
              font-size: 13px;
            ">
              This is an automated message from Pravah.
            </p>

            <p style="
              margin: 0;
              color: #94a3b8;
              font-size: 12px;
            ">
              © ${new Date().getFullYear()} Pravah. All rights reserved.
            </p>

          </div>

        </div>

      </body>
    </html>
  `;
}
