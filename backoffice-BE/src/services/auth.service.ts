// src/services/auth.service.ts
import * as dbService from "../db";
import {
  refreshTokens,
  passwordResetOTPs,
} from "../db/schema";
import {
  and,
  eq,
  gt,
  InferInsertModel,
  InferSelectModel,
  isNull,
  SQL,
} from "drizzle-orm";
import {
  generateAccessToken,
  generateOTP,
  generatePasswordResetToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyPasswordResetToken,
} from "../utils/auth.utils";
import type { IUser } from "./users.service";
import * as dojosService from "./dojos.service";
import * as mailerService from "./mailer.service";
import * as stripeService from "./stripe.service";
import * as userService from "./users.service";
import * as firebaseService from "./firebase.service";
import { addDays, addMinutes, isAfter } from "date-fns";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  TooManyRequestsException,
  UnauthorizedException,
} from "../core/errors";
import {
  FirebaseSignInDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RefreshTokenDTO,
  RegisterUserDTO,
  ResetPasswordDTO,
  VerifyOtpDTO,
} from "../validations/auth.schemas";
import type { Transaction } from "../db";
import { Role } from "../constants/enums";
import { returnFirst } from "../utils/db.utils";
import { UserDTO } from "../dtos/user.dtos";
import { AuthResponseDTO } from "../dtos/auth.dto";
import { formatDateForMySQL } from "../utils/date.utils";
import { UserOAuthAccountsRepository } from "../repositories/oauth-providers.repository";
import { PasswordResetOTPRepository } from "../repositories/password-reset-otps.repository";
import AppConstants from "../constants/AppConstants";

export type INewRefreshToken = InferInsertModel<typeof refreshTokens>;
export type IRefreshToken = InferSelectModel<typeof refreshTokens>;

export const saveRefreshToken = async (
  token: INewRefreshToken,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    await tx.insert(refreshTokens).values(token);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneRefreshToken = async (
  token: string,
  txInstance?: Transaction
): Promise<IRefreshToken | null> => {
  const execute = async (tx: Transaction) => {
    const storedToken = returnFirst(
      await tx
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.hashedToken, token))
        .limit(1)
        .execute()
    );

    return storedToken || null;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

/**
 * Token Rotation: Revoke the old token (or delete it)
     We mark it as revoked or delete it to prevent reuse.

     We choose to delete now to remove the need for cleaning up later
 */
export const deleteRefreshTokenById = async (
  tokenId: string,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    await deleteRefreshToken({txInstance: tx, whereClause: eq(refreshTokens.id, tokenId) });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const deleteRefreshTokenByUserId = async (
  userId: string,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    await deleteRefreshToken({
      txInstance: tx,
      whereClause: eq(refreshTokens.userId, userId),
    });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const deleteRefreshToken = async (
  {whereClause, txInstance}:{whereClause: SQL,
  txInstance?: Transaction}
) => {
  const execute = async (tx: Transaction) => {
    await tx.delete(refreshTokens).where(whereClause);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const generateAuthTokens = async ({
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

    await saveRefreshToken(
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

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const loginUser = async ({
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
    const user = await userService.getOneUserByEmail({
      email: dto.email,
      txInstance: tx,
      withPassword: true,
    });

    if (!user || !user.passwordHash)
      throw new UnauthorizedException(`Invalid credentials`);

    const isValid = await verifyPassword(user.passwordHash, dto.password);
    if (!isValid) throw new UnauthorizedException(`Invalid credentials`);

    if (dto.fcmToken) {
      await userService.updateUser({
        userId: user.id,
        update: {
          fcmToken: dto.fcmToken,
        },
        txInstance: tx,
      });
    }

    const { accessToken, refreshToken } = await generateAuthTokens({
      user,
      userIp,
      userAgent,
      txInstance,
    });

    return new AuthResponseDTO({
      accessToken,
      refreshToken,
      user: new UserDTO(user),
    });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const revokeRefreshToken = async ({
  dto,
  txInstance,
}: {
  dto: RefreshTokenDTO;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    const hashedToken = hashToken(dto.refreshToken);

    // 1. Find the token in DB
    const storedToken = await getOneRefreshToken(hashedToken, tx);

    if (
      !storedToken ||
      storedToken.revoked ||
      isAfter(new Date(), storedToken.expiresAt)
    ) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // 2. Token Rotation: Revoke the old token (or delete it)
    // We mark it as revoked or delete it to prevent reuse.
    await deleteRefreshTokenById(storedToken.id, tx);

    return storedToken;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const refreshAccessToken = async ({
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
    const revokedToken = await revokeRefreshToken({ dto, txInstance: tx });

    // 3. Issue NEW pair
    const user = await userService.getOneUserByID({
      userId: revokedToken.userId,
    });

    if (!user) throw new NotFoundException("User not found");

    const authTokens = await generateAuthTokens({
      user,
      userIp,
      userAgent,
      txInstance: tx,
    });

    return new AuthResponseDTO({
      ...authTokens,
      user: new UserDTO(user),
    });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const registerUser = async (
  {
    userDTO,
    userIp,
    userAgent,
  }: {
    userDTO: RegisterUserDTO;
    userIp?: string;
    userAgent?: string;
  },
  txInstance?: dbService.Transaction
): Promise<AuthResponseDTO> => {
  const execute = async (tx: dbService.Transaction) => {
    try {
      // --- CHECK EMAIL & USERNAME (Transactional Querying) ---
      const [existingUserWithEmail, existingUserWithUsername] =
        await Promise.all([
          userService.getOneUserByEmail({
            email: userDTO.email,
            txInstance: tx,
          }),
          userService.getOneUserByUserName({
            username: userDTO.username,
            txInstance: tx,
          }),
        ]);

      if (existingUserWithEmail) {
        throw new ConflictException("Email already registered");
      }

      if (existingUserWithUsername) {
        throw new ConflictException("Username already taken");
      }

      // Generate Referral Code and Hash Password
      const referral_code = userService.generateReferralCode();
      const hashedPassword = await hashPassword(userDTO.password);

      let stripeCustomerId: string | null = null;
      let stripeSubscriptionId: string | null = null;
      let subscriptionStatus: string | null = null;
      let trialEndsAt: Date | null = null;

      if (userDTO.role === Role.DojoAdmin) {
        try {
          // Stripe Customer & Subscription
          const stripeCustomer = await stripeService.createCustomers(
            userDTO.fullName,
            userDTO.email,
            userDTO.paymentMethod
          );

          const stripeSubscription = await stripeService.createSubscription(
            stripeCustomer,
            userDTO.plan
          );

          stripeCustomerId = stripeCustomer.id;
          stripeSubscriptionId = stripeSubscription.id;
          subscriptionStatus = stripeSubscription.status;

          // Convert Stripe timestamp (seconds) to ISO string
          trialEndsAt = stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null;
        } catch (err: any) {
          console.error("Stripe API error:", err.message);
          throw new InternalServerErrorException(
            `Stripe API error: ${err.message || ""}`
          );
        }
      }

      const newUser = await userService.saveUser(
        {
          name: userDTO.fullName,
          username: userDTO.username,
          email: userDTO.email,
          passwordHash: hashedPassword,
          role: userDTO.role,
          activeSub: userDTO.plan,
          referralCode: referral_code,
          referredBy: userDTO.referredBy,
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionStatus,
          trialEndsAt: trialEndsAt ? formatDateForMySQL(trialEndsAt) : null,
        },
        tx
      );

      if (userDTO.role === Role.DojoAdmin) {
        await userService.setDefaultPaymentMethod(
          newUser,
          userDTO.paymentMethod,
          tx
        );

        await dojosService.saveDojo(
          {
            userId: newUser.id,
            name: userDTO.dojoName,
            tag: userDTO.dojoTag,
            tagline: userDTO.dojoTagline,
          },
          tx
        );
      }

      const { accessToken, refreshToken } = await generateAuthTokens({
        user: newUser,
        userAgent,
        userIp,
        txInstance: tx,
      });

      try {
        await mailerService.sendWelcomeEmail(
          userDTO.email,
          userDTO.fullName,
          userDTO.role
        );
      } catch (err) {
        console.log(
          "[Consumed Error]: An Error occurred while trying to send email and notification. Error: ",
          err
        );
      }

      return new AuthResponseDTO({
        accessToken,
        refreshToken,
        user: new UserDTO(newUser),
      });
    } catch (err) {
      console.log(`An error occurred while trying to register user: ${err}`);
      throw err;
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const logoutUser = async ({
  dto,
  txInstance,
}: {
  dto: RefreshTokenDTO;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    await revokeRefreshToken({ dto, txInstance: tx });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const isUsernameAvailable = async ({
  username,
  txInstance,
}: {
  username: string;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    const user = await userService.getOneUserByUserName({
      username,
      txInstance: tx,
    });

    if (user) {
      return false;
    }

    return true;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const firebaseSignIn = async ({
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
    const firebaseUser = await firebaseService.verifyFirebaseToken(dto.idToken);

    if (!firebaseUser.emailVerified) {
      throw new UnauthorizedException("Social Auth Email not verified");
    }

    let user = await userService.getOneUserByEmail({
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
          updatedAt: formatDateForMySQL(new Date()),
          profileData: {
            name: firebaseUser.name,
            picture: firebaseUser.picture,
          },
        },
      });
    }

    const { accessToken, refreshToken } = await generateAuthTokens({
      user,
      userIp,
      userAgent,
      txInstance,
    });

    return new AuthResponseDTO({
      accessToken,
      refreshToken,
      user: new UserDTO(user),
    });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const initForgetPassword = async ({
  dto,
  txInstance,
}: {
  dto: ForgotPasswordDTO;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    const user = await userService.getOneUserByEmail({
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

    await mailerService.sendPasswordResetMail({
      dest: user.email,
      name: user.name,
      otp,
    });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const verifyOtp = async ({
  dto,
  txInstance,
}: {
  dto: VerifyOtpDTO;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    const user = await userService.getOneUserByEmail({
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

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const resetPassword = async ({
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
    await userService.updateUser({
      txInstance: tx,
      userId: decoded.userId,
      update: { passwordHash: newPasswordHash },
    });

    // Security: Kill all sessions (Log out all devices)
    await deleteRefreshTokenByUserId(decoded.userId, tx)
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};
