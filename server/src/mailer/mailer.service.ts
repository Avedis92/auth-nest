import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private config: ConfigService) {}

  emailTransporter() {
    const transporter = createTransport({
      host: this.config.get('smtp.host'),
      port: Number(this.config.get('smtp.port')),
      secure: false, // true only for port 465
      auth: {
        user: this.config.get('smtp.user'),
        pass: this.config.get('smtp.pass'),
      },
    });
    return transporter;
  }
  async sendEmail(email: string, resetLink: string) {
    const transporter = this.emailTransporter();
    await transporter.sendMail({
      from: 'No reply Auth service',
      to: email,
      subject: 'Reset your password',
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
      `,
    });
  }
}
