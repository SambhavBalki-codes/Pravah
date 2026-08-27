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
        background-color: #f4f7fb;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
      ">

        <div style="
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        ">

          <!-- Header -->
          <div style="
            padding: 28px 40px;
            background-color: #111827;
            text-align: center;
          ">

            <h1 style="
              margin: 0;
              color: #ffffff;
              font-size: 28px;
              letter-spacing: 1px;
            ">
              Pravah
            </h1>

            <p style="
              margin: 8px 0 0;
              color: #d1d5db;
              font-size: 14px;
            ">
              Learn. Manage. Grow.
            </p>

          </div>


          <!-- Main Content -->
          <div style="padding: 40px;">

            <h2 style="
              margin: 0 0 20px;
              color: #111827;
              font-size: 24px;
            ">
              Password Reset Request
            </h2>

            <p style="
              margin: 0 0 16px;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.7;
            ">
              Hello,
            </p>

            <p style="
              margin: 0 0 20px;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.7;
            ">
              We received a request to reset the password associated
              with your Pravah account.
            </p>

            <p style="
              margin: 0 0 28px;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.7;
            ">
              Click the button below to create a new password for your account.
            </p>


            <!-- Reset Password Button -->
            <div style="
              text-align: center;
              margin: 32px 0;
            ">

              <a
                href="${resetPasswordUrl}"
                style="
                  display: inline-block;
                  padding: 14px 30px;
                  background-color: #111827;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 15px;
                  font-weight: bold;
                "
              >
                Reset Password
              </a>

            </div>


            <!-- Fallback Link -->
            <p style="
              margin: 0 0 10px;
              color: #6b7280;
              font-size: 13px;
              line-height: 1.6;
            ">
              If the button above doesn't work, copy and paste the
              following link into your browser:
            </p>

            <div style="
              padding: 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
              margin-bottom: 28px;
            ">

              <a
                href="${resetPasswordUrl}"
                style="
                  color: #374151;
                  font-size: 13px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                ${resetPasswordUrl}
              </a>

            </div>


            <!-- Security Information -->
            <p style="
              margin: 0 0 12px;
              color: #6b7280;
              font-size: 14px;
              line-height: 1.6;
            ">
              For your security, this password-reset link will expire
              after a limited period of time.
            </p>

            <p style="
              margin: 0;
              color: #6b7280;
              font-size: 14px;
              line-height: 1.6;
            ">
              If you did not request a password reset, you can safely
              ignore this email. Your account will remain secure.
            </p>

          </div>


          <!-- Footer -->
          <div style="
            padding: 24px 40px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          ">

            <p style="
              margin: 0 0 8px;
              color: #6b7280;
              font-size: 13px;
            ">
              This is an automated message from Pravah.
            </p>

            <p style="
              margin: 0;
              color: #9ca3af;
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