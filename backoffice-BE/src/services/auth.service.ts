// src/services/auth.service.ts
import * as dbService from "../db";
import { refreshTokens } from "../db/schema";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "../utils/auth.utils";
import type { IUser } from "./users.service";
import * as dojosService from "./dojos.service";
import * as mailerService from "./mailer.service";
import * as stripeService from "./stripe.service";
import * as userService from "./users.service";
import { addDays, isAfter } from "date-fns";
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "../core/errors";
import { LoginDTO, RegisterUserDTO } from "../validations/auth.schemas";
import type { Transaction } from "../db";
import { Role } from "../constants/enums";
import { returnFirst } from "../utils/db.utils";

export type INewRefreshToken = InferInsertModel<typeof refreshTokens>;
export type IRefreshToken = InferSelectModel<typeof refreshTokens>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export interface AuthResponse extends AuthTokens {
  user: IUser;
}

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
export const deleteRefreshToken = async (
  tokenId: string,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    await tx.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));
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

    // 3. Store refresh token with expiry (e.g., 7 days)
    const expiresAt = addDays(new Date(), 7);

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
}): Promise<AuthResponse> => {
  const execute = async (tx: Transaction) => {
    const user = await userService.getOneUserByEmail({
      email: dto.email,
      txInstance: tx,
      withPassword: true,
    });

    if (!user) throw new UnauthorizedException(`Invalid credentials-404`);

    const isValid = await verifyPassword(user.passwordHash, dto.password);
    if (!isValid) throw new UnauthorizedException(`Invalid credentials`);

    const { accessToken, refreshToken } = await generateAuthTokens({
      user,
      userIp,
      userAgent,
      txInstance,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const refreshUserToken = async ({
  token,
  userIp,
  userAgent,
  txInstance,
}: {
  token: string;
  userIp: string;
  userAgent: string;
  txInstance?: Transaction;
}): Promise<AuthResponse> => {
  const execute = async (tx: Transaction) => {
    const hashedToken = hashToken(token);

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
    await deleteRefreshToken(storedToken.id, tx);

    // 3. Issue NEW pair
    const user = await userService.getOneUserByID({
      userId: storedToken.userId,
    });
    if (!user) throw new NotFoundException("User not found");

    const authTokens = await generateAuthTokens({
      user,
      userIp,
      userAgent,
      txInstance: tx,
    });

    return {
      ...authTokens,
      user,
    };
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
): Promise<AuthResponse> => {
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
      let trialEndsAt: string | null = null;

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
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
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
          trialEndsAt,
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

      return {
        accessToken,
        refreshToken,
        user: newUser,
      };
    } catch (err) {
      console.log(`An error occurred while trying to register user: ${err}`);
      throw err;
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};
