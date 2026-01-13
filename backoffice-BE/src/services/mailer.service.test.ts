import { describe, it, expect, beforeEach, beforeAll, afterAll,vi } from "vitest";
import nodemailer from "nodemailer";
import { MailerService} from "./mailer.service.js";
import AppConfig from "../config/AppConfig.js";
import { Role } from "../constants/enums.js";

describe("Mailer Service", () => {
  const sendMailMock = vi.fn();

  beforeAll(() => {
    // Spy on createTransport to return a mock transporter.
    // This handles the singleton nature of getTransporter by ensuring
    // the first call returns our mock, which is then cached.
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: sendMailMock,
    } as any);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    sendMailMock.mockResolvedValue({ messageId: "test-id" });

    // Mock AppConfig values
    AppConfig.ZOHO_EMAIL = "test@zoho.com";
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email to DojoAdmin with correct content", async () => {
      const dest = "admin@example.com";
      const name = "Admin User";
      const role = Role.DojoAdmin;

      await MailerService.sendDojoAdminWelcomeEmail(dest, name, role);

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions).toMatchObject({
        to: dest,
        subject: "Welcome to Dojo Connect - Your Admin Dashboard is Ready",
        from: '"Dojo Connect" <support@dojoconnect.app>',
      });
      expect(mailOptions.html).toContain(
        "Your admin access has been successfully activated"
      );
    });

    it("should send welcome email to non-admin user with correct content", async () => {
      const dest = "user@example.com";
      const name = "Regular User";
      // Casting to Role to avoid import issues if Parent doesn't exist in the enum context available here,
      // but assuming it works based on typical usage.
      const role = "Parent" as Role;

      await MailerService.sendDojoAdminWelcomeEmail(dest, name, role);

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions).toMatchObject({
        to: dest,
        subject: "Welcome to Dojo Connect",
        from: '"Dojo Connect" <support@dojoconnect.app>',
      });
      expect(mailOptions.html).toContain(
        `Your account has been successfully created as a <strong>${role}</strong>`
      );
    });

    it("should log error if sending fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      sendMailMock.mockRejectedValueOnce(new Error("SMTP Error"));

      await MailerService.sendDojoAdminWelcomeEmail(
        "fail@example.com",
        "Fail User",
        Role.DojoAdmin
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Welcome email failed to fail@example.com")
      );
      consoleSpy.mockRestore();
    });
  });

  describe("sendPasswordResetMail", () => {
    it("should send password reset email with OTP", async () => {
      const dest = "reset@example.com";
      const name = "Reset User";
      const otp = "123456";

      await MailerService.sendPasswordResetMail({ dest, name, otp });

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions).toMatchObject({
        to: dest,
        subject: "Your Dojo Connect Password Reset Code",
        from: '"Dojo Connect" <test@zoho.com>',
      });
      expect(mailOptions.html).toContain(otp);
      expect(mailOptions.html).toContain(name);
    });

    it("should log error if sending fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      sendMailMock.mockRejectedValueOnce(new Error("Network Error"));

      await MailerService.sendPasswordResetMail({
        dest: "fail@example.com",
        name: "Fail",
        otp: "000000",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Password reset email failed to fail@example.com"
        )
      );
      consoleSpy.mockRestore();
    });
  });
});
