// src/services/auth.service.ts
import * as dbService from "../db/index.js";
import { passwordResetOTPs } from "../db/schema.js";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  generateAccessToken,
  generateOTP,
  generatePasswordResetToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyPasswordResetToken,
} from "../utils/auth.utils.js";
import { DojosService } from "./dojos.service.js";
import { MailerService } from "./mailer.service.js";
import { UsersService } from "./users.service.js";
import { FirebaseService } from "./firebase.service.js";
import { addDays, addMinutes, isAfter } from "date-fns";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  TooManyRequestsException,
  UnauthorizedException,
} from "../core/errors/index.js";
import {
  CreateUserBaseDTO,
  FirebaseSignInDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RefreshTokenDTO,
  RegisterDojoAdminDTO,
  ResetPasswordDTO,
  VerifyOtpDTO,
  RegisterParentDTO,
} from "../validations/auth.schemas.js";
import type { Transaction } from "../db/index.js";
import { DojoStatus, Role } from "../constants/enums.js";
import {
  AuthResponseDTO,
  RegisterDojoAdminResponseDTO,
} from "../dtos/auth.dtos.js";
import { UserOAuthAccountsRepository } from "../repositories/oauth-providers.repository.js";
import { PasswordResetOTPRepository } from "../repositories/password-reset-otps.repository.js";
import AppConstants from "../constants/AppConstants.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { UserDTO } from "../dtos/user.dtos.js";
import { IUser } from "../repositories/user.repository.js";
import { SubscriptionService } from "./subscription.service.js";
import { NotificationService } from "./notifications.service.js";
import { BaseDojoDTO } from "../dtos/dojo.dtos.js";

export class AuthService {
  static generateAuthTokens = async ({
    user,
    userIp,
    userAgent,
    txInstance,
  }: {
    user: IUser;
    userIp?: string;
    userAgent?: string;
    txInstance?: Transaction;
  }): Promise<{ accessToken: string; refreshToken: string }> => {
    const execute = async (tx: Transaction) => {
      // 1. Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role!,
      });
      const refreshToken = generateRefreshToken();

      // 2. Hash refresh token for storage
      const hashedRefreshToken = hashToken(refreshToken);

      // 3. Store refresh token with expiry (e.g., 30 days)
      const expiresAt = addDays(new Date(), 30);

      await RefreshTokenRepository.create(
        {
          userId: user.id,
          hashedToken: hashedRefreshToken,
          expiresAt: expiresAt,
          userAgent,
          userIp,
        },
        tx
      );

      // 4. Return raw tokens to the mobile app
      return { accessToken, refreshToken };
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static loginUser = async ({
    dto,
    userIp,
    userAgent,
    txInstance,
  }: {
    dto: LoginDTO;
    userIp?: string;
    userAgent?: string;
    txInstance?: Transaction;
  }): Promise<AuthResponseDTO> => {
    const execute = async (tx: Transaction) => {
      const user = await UsersService.getOneUserByEmail({
        email: dto.email,
        txInstance: tx,
        withPassword: true,
      });

      if (!user || !user.passwordHash)
        throw new UnauthorizedException(`Invalid credentials`);

      const isValid = await verifyPassword(user.passwordHash, dto.password);
      if (!isValid) throw new UnauthorizedException(`Invalid credentials`);

      if (dto.fcmToken) {
        await UsersService.updateUser({
          userId: user.id,
          update: {
            fcmToken: dto.fcmToken,
          },
          txInstance: tx,
        });
      }

      const [authTokens, dojo] = await Promise.all([
        AuthService.generateAuthTokens({
          user,
          userIp,
          userAgent,
          txInstance: tx,
        }),
        DojosService.fetchUserDojo({
          user,
          txInstance: tx,
        }),
      ]);

      if (!dojo) {
        throw new NotFoundException("Dojo not found for user");
      }

      return new AuthResponseDTO({
        ...authTokens,
        user: new UserDTO({ ...user, dojo: new BaseDojoDTO(dojo) }),
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static revokeRefreshToken = async ({
    dto,
    txInstance,
  }: {
    dto: RefreshTokenDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const hashedToken = hashToken(dto.refreshToken);

      // 1. Find the token in DB
      const storedToken = await RefreshTokenRepository.getOne(hashedToken, tx);

      if (
        !storedToken ||
        storedToken.revoked ||
        isAfter(new Date(), storedToken.expiresAt)
      ) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      // 2. Token Rotation: Revoke the old token (or delete it)
      // We mark it as revoked or delete it to prevent reuse.
      await RefreshTokenRepository.deleteById(storedToken.id, tx);

      return storedToken;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static refreshAccessToken = async ({
    dto,
    userIp,
    userAgent,
    txInstance,
  }: {
    dto: RefreshTokenDTO;
    userIp?: string;
    userAgent?: string;
    txInstance?: Transaction;
  }): Promise<AuthResponseDTO> => {
    const execute = async (tx: Transaction) => {
      const revokedToken = await AuthService.revokeRefreshToken({
        dto,
        txInstance: tx,
      });

      // 3. Issue NEW pair
      const user = await UsersService.getOneUserByID({
        userId: revokedToken.userId,
      });

      if (!user) throw new NotFoundException("User not found");

      const [authTokens, dojo] = await Promise.all([
        AuthService.generateAuthTokens({
          user,
          userIp,
          userAgent,
          txInstance: tx,
        }),
        DojosService.fetchUserDojo({
          user,
          txInstance: tx,
        }),
      ]);

      if (!dojo) {
        throw new NotFoundException("Dojo not found for user");
      }

      return new AuthResponseDTO({
        ...authTokens,
        user: new UserDTO({ ...user, dojo: new BaseDojoDTO(dojo) }),
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static createUser = async ({
    dto,
    role,
    tx,
  }: {
    dto: CreateUserBaseDTO;
    role: Role;
    tx: Transaction;
  }) => {
    const hashedPassword = await hashPassword(dto.password);

    return await UsersService.saveUser(
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash: hashedPassword,
        username: dto.username,
        role,
        fcmToken: dto.fcmToken || null,
      },
      tx
    );
  };

  static registerDojoAdmin = async (
    {
      dto,
      userIp,
      userAgent,
    }: {
      dto: RegisterDojoAdminDTO;
      userIp?: string;
      userAgent?: string;
    },
    txInstance?: dbService.Transaction
  ): Promise<RegisterDojoAdminResponseDTO> => {
    const execute = async (tx: dbService.Transaction) => {
      try {
        // --- CHECK EMAIL & USERNAME (Transactional Querying) ---
        const [
          existingUserWithEmail,
          existingUserWithUsername,
          existingDojoWithTag,
        ] = await Promise.all([
          UsersService.getOneUserByEmail({
            email: dto.email,
            txInstance: tx,
          }),
          UsersService.getOneUserByUserName({
            username: dto.username,
            txInstance: tx,
          }),
          DojosService.getOneDojoByTag(dto.dojoTag, tx),
        ]);

        if (existingUserWithEmail) {
          throw new ConflictException("Email already registered");
        }

        if (existingUserWithUsername) {
          throw new ConflictException("Username already taken");
        }

        if (existingDojoWithTag) {
          throw new ConflictException("Dojo tag already exists");
        }

        const newUser = await AuthService.createUser({
          dto: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            username: dto.username,
            email: dto.email,
            password: dto.password,
            fcmToken: dto.fcmToken,
          },
          role: Role.DojoAdmin,
          tx,
        });

        // Generate Referral Code and Hash Password
        const referral_code = DojosService.generateReferralCode();

        let trialEndsAt: Date | null = addDays(new Date(), 14);

        const newDojo = await DojosService.createDojo(
          {
            ownerUserId: newUser.id,
            name: dto.dojoName,
            tag: dto.dojoTag,
            tagline: dto.dojoTagline,
            activeSub: dto.plan,
            trialEndsAt,
            status: DojoStatus.Registered,
            referralCode: referral_code,
            referredBy: dto.referredBy,
          },
          tx
        );

        let stripeClientSecret: string | null = null;

        try {
          // Setup Dojo Admin Billing
          const { clientSecret } =
            await SubscriptionService.setupDojoAdminBilling({
              dojo: newDojo,
              user: newUser,
              txInstance: tx,
            });

          stripeClientSecret = clientSecret;
        } catch (err: any) {
          if (err instanceof HttpException) {
            throw err;
          }

          console.error("Stripe API error:", err.message);
          throw new InternalServerErrorException(
            `Stripe API error: ${err.message || ""}`
          );
        }

        const [authTokens, dojo] = await Promise.all([
          AuthService.generateAuthTokens({
            user: newUser,
            userIp,
            userAgent,
            txInstance: tx,
          }),
          DojosService.fetchUserDojo({
            user: newUser,
            txInstance: tx,
          }),
        ]);

        if (!dojo) {
          throw new NotFoundException("Dojo not found for user");
        }

        try {
          await MailerService.sendDojoAdminWelcomeEmail(
            dto.email,
            dto.firstName,
            Role.DojoAdmin
          );

          await NotificationService.sendDojoAdminSignUpNotification(newUser);
        } catch (err) {
          console.log(
            "[Consumed Error]: An Error occurred while trying to send email and notification. Error: ",
            err
          );
        }

        return new RegisterDojoAdminResponseDTO({
          stripeClientSecret: stripeClientSecret!,
          ...authTokens,
          user: new UserDTO({ ...newUser, dojo: new BaseDojoDTO(dojo) }),
        });
      } catch (err) {
        console.log(`An error occurred while trying to register user: ${err}`);
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static registerParent = async (
    {
      dto,
      userIp,
      userAgent,
    }: {
      dto: RegisterParentDTO;
      userIp?: string;
      userAgent?: string;
    },
    txInstance?: dbService.Transaction
  ): Promise<AuthResponseDTO> => {
    const execute = async (tx: dbService.Transaction) => {

      // --- CHECK EMAIL & USERNAME (Transactional Querying) ---
        const [
          existingUserWithEmail,
          existingUserWithUsername
        ] = await Promise.all([
          UsersService.getOneUserByEmail({
            email: dto.email,
            txInstance: tx,
          }),
          UsersService.getOneUserByUserName({
            username: dto.username,
            txInstance: tx,
          }),
        ]);

        if (existingUserWithEmail) {
          throw new ConflictException("Email already registered");
        }

        if (existingUserWithUsername) {
          throw new ConflictException("Username already taken");
        }

      const newUser = await AuthService.createUser({
        dto,
        role: Role.Parent,
        tx,
      });

      // Send Welcome
      try {
        await MailerService.sendParentWelcomeEmail(
          newUser.email,
          newUser.firstName
        );
        await NotificationService.sendParentSignUpNotification(newUser);
      } catch (err) {
        console.log("Error sending welcome email/notification", err);
      }

      const authTokens = await AuthService.generateAuthTokens({
        user: newUser,
        userIp,
        userAgent,
        txInstance: tx,
      });

      return new AuthResponseDTO({
        ...authTokens,
        user: new UserDTO({ ...newUser, dojo: undefined }),
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static logoutUser = async ({
    dto,
    txInstance,
  }: {
    dto: RefreshTokenDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      await AuthService.revokeRefreshToken({ dto, txInstance: tx });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static isUsernameAvailable = async ({
    username,
    txInstance,
  }: {
    username: string;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const user = await UsersService.getOneUserByUserName({
        username,
        txInstance: tx,
      });

      if (user) {
        return false;
      }

      return true;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static isDojoTagAvailable = async ({
    tag,
    txInstance,
  }: {
    tag: string;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const dojo = await DojosService.getOneDojoByTag(tag, tx);

      if (dojo) {
        return false;
      }

      return true;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static firebaseSignIn = async ({
    dto,
    userIp,
    userAgent,
    txInstance,
  }: {
    dto: FirebaseSignInDTO;
    userIp?: string;
    userAgent?: string;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // 1. Verify with Firebase
      const firebaseUser = await FirebaseService.verifyFirebaseToken(
        dto.idToken
      );

      if (!firebaseUser.emailVerified) {
        throw new UnauthorizedException("Social Auth Email not verified");
      }

      let user = await UsersService.getOneUserByEmail({
        email: firebaseUser.email!,
        txInstance: tx,
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      let oAuthAcct =
        await UserOAuthAccountsRepository.findByProviderAndProviderUserId({
          tx,
          provider: firebaseUser.provider,
          providerUserId: firebaseUser.uid,
        });

      if (!oAuthAcct) {
        // Create OAuth link
        await UserOAuthAccountsRepository.createOAuthAcct({
          tx,
          dto: {
            userId: user.id,
            provider: firebaseUser.provider,
            providerUserId: firebaseUser.uid,
            profileData: {
              name: firebaseUser.name,
              picture: firebaseUser.picture,
            },
          },
        });
      } else {
        // Update existing OAuth Acct
        await UserOAuthAccountsRepository.updateOAuthAcct({
          oAuthAcctId: oAuthAcct.id,
          tx,
          update: {
            updatedAt: new Date(),
            profileData: {
              name: firebaseUser.name,
              picture: firebaseUser.picture,
            },
          },
        });
      }

      const [authTokens, dojo] = await Promise.all([
        AuthService.generateAuthTokens({
          user,
          userIp,
          userAgent,
          txInstance: tx,
        }),
        DojosService.fetchUserDojo({
          user,
          txInstance: tx,
        }),
      ]);

      if (!dojo) {
        throw new NotFoundException("Dojo not found for user");
      }

      return new AuthResponseDTO({
        ...authTokens,
        user: new UserDTO({ ...user, dojo: new BaseDojoDTO(dojo) }),
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static initForgetPassword = async ({
    dto,
    txInstance,
  }: {
    dto: ForgotPasswordDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const user = await UsersService.getOneUserByEmail({
        email: dto.email,
        txInstance: tx,
      });

      if (!user) return; // Silent fail (security: prevent email enumeration)

      // Invalidate ANY previous unused tokens for this user
      // (Prevents stacking valid OTPs)
      await PasswordResetOTPRepository.updateOTP({
        tx,
        update: { used: true },
        whereClause: eq(passwordResetOTPs.userId, user.id),
      });

      // Generate  OTP
      const otp = generateOTP();
      const hashedOTP = hashToken(otp); // Still hash it!

      // Short Expiry (15 Minutes max for OTPs)
      const expiresAt = addMinutes(new Date(), 15);

      await PasswordResetOTPRepository.createOTP({
        tx,
        dto: {
          userId: user.id,
          hashedOTP,
          expiresAt,
          attempts: 0, // Reset attempts
        },
      });

      await MailerService.sendPasswordResetMail({
        dest: user.email,
        name: user.firstName,
        otp,
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static verifyOtp = async ({
    dto,
    txInstance,
  }: {
    dto: VerifyOtpDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const user = await UsersService.getOneUserByEmail({
        email: dto.email,
        txInstance: tx,
      });

      if (!user) {
        throw new BadRequestException("Invalid OTP");
      }

      // Hash the provided OTP
      const otpHash = hashToken(dto.otp);

      const otpRecord = await PasswordResetOTPRepository.findOne({
        tx,
        whereClause: and(
          eq(passwordResetOTPs.userId, user.id),
          eq(passwordResetOTPs.hashedOTP, otpHash),
          eq(passwordResetOTPs.used, false),
          isNull(passwordResetOTPs.blockedAt),
          gt(passwordResetOTPs.expiresAt, new Date())
        ),
      });

      if (!otpRecord) {
        // OTP not found - increment attempts on all active OTPs
        await PasswordResetOTPRepository.incrementActiveOTPsAttempts({
          tx,
          userId: user.id,
        });
        throw new BadRequestException("Invalid or expired OTP");
      }

      // CHECK ATTEMPTS (Security Critical)
      if (otpRecord.attempts! >= AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS) {
        // Burn the token immediately if it hasn't been burned yet
        await PasswordResetOTPRepository.updateOneOTP({
          tx,
          otpID: otpRecord.id,
          update: {
            used: true,
            attempts: otpRecord.attempts! + 1,
          },
        });

        throw new TooManyRequestsException(
          "Too many failed attempts. Request a new code."
        );
      }

      // SUCCESS: Burn the OTP immediately!
      // The OTP is now dead. It cannot be used again.
      await PasswordResetOTPRepository.updateOneOTP({
        tx,
        otpID: otpRecord.id,
        update: {
          used: true,
        },
      });

      // D. ISSUE THE "PERMISSION SLIP" (Exchange Token)
      // This is a JWT specifically for resetting the password.
      // It expires in 5 minutes (enough time to type a new password).
      const resetToken = generatePasswordResetToken(user.id);
      return { resetToken };
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static resetPassword = async ({
    txInstance,
    dto,
  }: {
    dto: ResetPasswordDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const decoded = verifyPasswordResetToken(dto.resetToken);

      // Hash new password
      const newPasswordHash = await hashPassword(dto.newPassword);

      // Update Password
      await UsersService.updateUser({
        txInstance: tx,
        userId: decoded.userId,
        update: { passwordHash: newPasswordHash },
      });

      // Security: Kill all sessions (Log out all devices)
      await RefreshTokenRepository.deleteByUserId(decoded.userId, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static generateUsername = async ({
    email,
    txInstance,
  }: {
    email: string;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
            // Generate Username
      let username = email.split("@")[0];
      let isAvailable = await AuthService.isUsernameAvailable({
        username,
        txInstance: tx,
      });

      if (!isAvailable) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        username = `${username}${randomSuffix}`;
        const isAvailableRetry = await AuthService.isUsernameAvailable({
          username,
          txInstance: tx,
        });
        if (!isAvailableRetry) {
          throw new ConflictException(
            "Could not generate a unique username. Please try a different email."
          );
        }
      }

      return username;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
