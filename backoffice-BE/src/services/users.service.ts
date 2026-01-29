import { and, eq, InferInsertModel, InferSelectModel, not, SQL } from "drizzle-orm";
import { userCards, users } from "../db/schema.js";
import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import { INewUser, IUpdateUser, IUser, UserRepository } from "../repositories/user.repository.js";
import { InstructorService } from "./instructor.service.js";
import { StudentService } from "./student.service.js";
import { ParentService } from "./parent.service.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";
import { Role } from "../constants/enums.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { DojosService } from "./dojos.service.js";
import {
  DojoAdminUserDTO,
  InstructorUserDTO,
  ParentUserDTO,
  StudentUserDTO,
  UserDTO,
} from "../dtos/user.dtos.js";
import { UpdateProfileDTO, UpdateProfileImageDTO } from "../validations/users.schemas.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { ImageType } from "../constants/cloudinary.js";

export type IUserCard = InferSelectModel<typeof userCards>;
export type INewUserCard = InferInsertModel<typeof userCards>;

export class UsersService {
  static getOneUser = async (
    {
      whereClause,
      withPassword = false,
    }: {
      whereClause: SQL;
      withPassword?: boolean;
    },
    txInstance?: Transaction,
  ): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      let user = await UserRepository.getOne({ whereClause, withPassword, tx });

      if (!user) {
        return null;
      }

      if (!withPassword) {
        const { passwordHash, ...rest } = user;
        user = { ...rest } as IUser;
      }

      return user;
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getOneUserByID = async ({
    userId,
    withPassword = false,
    txInstance,
  }: {
    userId: string;
    withPassword?: boolean;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser({ whereClause: eq(users.id, userId), withPassword }, tx);
      } catch (err: any) {
        console.error(`Error fetching user by ID: ${userId}`, { err });
        throw err;
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getOneUserByEmail = async ({
    email,
    withPassword = false,
    txInstance,
  }: {
    email: string;
    withPassword?: boolean;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser(
          {
            whereClause: eq(users.email, email),
            withPassword,
          },
          tx,
        );
      } catch (err: any) {
        console.error(`Error fetching user by Email: ${email}`, { err });
        throw err;
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getOneUserByUserName = async ({
    username,
    txInstance,
  }: {
    username: string;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser(
          {
            whereClause: eq(users.username, username),
          },
          tx,
        );
      } catch (err: any) {
        console.error(`Error fetching dojo by Username: ${username}`, { err });
        throw err;
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static fetchUserCards = async (
    userId: string,
    txInstance?: Transaction,
  ): Promise<IUserCard[]> => {
    const execute = async (tx: Transaction) => {
      try {
        const cards = await tx
          .select()
          .from(userCards)
          .where(eq(userCards.userId, userId))
          .execute();

        return cards;
      } catch (err: any) {
        console.error(`Error fetching user cards for user ID: ${userId}`, {
          err,
        });
        throw err;
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static fetchUserCardsByPaymentMethod = async (
    paymentMethod: string,
    txInstance?: Transaction,
  ): Promise<IUserCard[]> => {
    const execute = async (tx: Transaction) => {
      try {
        const cards = await tx
          .select()
          .from(userCards)
          .where(eq(userCards.paymentMethodId, paymentMethod))
          .execute();

        return cards;
      } catch (err: any) {
        console.error(`Error fetching user cards by payment method: ${paymentMethod}`, { err });
        throw err;
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static saveUser = async (user: INewUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      const newUserId = await UserRepository.create(user, tx);

      return (await UsersService.getOneUserByID({
        userId: newUserId,
        txInstance: tx,
      }))!;
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static updateUser = async ({
    userId,
    update,
    txInstance,
  }: {
    userId: string;
    update: IUpdateUser;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      await UserRepository.update({ userId, update, tx });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static updateProfile = async (
    user: IUser,
    update: UpdateProfileDTO,
    txInstance?: Transaction,
  ): Promise<UserDTO> => {
    const execute = async (tx: Transaction) => {
        const existingUser = await UsersService.getOneUser(
          {
            whereClause: and(eq(users.username, update.username), not(eq(users.id, user.id)))!,
          },
          tx,
        );

        if (existingUser) {
          throw new ConflictException("Username already taken");
        }

      await UsersService.updateUser({ userId: user.id, update, txInstance: tx });

      const updatedUser = Object.assign(user, update);

      return new UserDTO(updatedUser);
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static saveUserCard = async (userCard: INewUserCard, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      await tx.insert(userCards).values(userCard);
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getUserDTO = async (user: IUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      switch (user.role) {
        case Role.DojoAdmin:
          return UsersService.getDojoAdminUserDTO(user, tx);
        case Role.Instructor:
          return UsersService.getInstructorUserDto(user, tx);
        case Role.Parent:
          return UsersService.getParentUserDto(user, tx);
        case Role.Child:
          return UsersService.getStudentUserDto(user, tx);
        default:
          throw new InternalServerErrorException(
            "User is not a DojoAdmin, Instructor, Parent or Child",
          );
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getDojoAdminUserDTO = async (user: IUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.DojoAdmin) {
        throw new UnauthorizedException("User is not a DojoOwner");
      }

      const dojo = await DojosService.fetchUserDojo({
        user,
        txInstance: tx,
      });

      if (!dojo) {
        throw new NotFoundException("Dojo not found for DojoOwner");
      }

      return new DojoAdminUserDTO({
        ...user,
        dojo,
      });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getInstructorUserDto = async (user: IUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Instructor) {
        throw new UnauthorizedException("User is not an Instructor");
      }

      const [instructor, dojo] = await Promise.all([
        InstructorService.findInstructorByUserId(user.id, tx),
        DojosService.fetchUserDojo({
          user,
          txInstance: tx,
        }),
      ]);

      if (!instructor) {
        throw new NotFoundException("Instructor not found for Instructor");
      }

      if (!dojo) {
        throw new NotFoundException("Dojo not found for Instructor");
      }

      return new InstructorUserDTO({
        ...user,
        instructor,
        dojo,
      });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getParentUserDto = async (user: IUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Parent) {
        throw new UnauthorizedException("User is not a Parent");
      }

      const parent = await ParentService.getOneParentByUserId(user.id, tx);

      if (!parent) {
        throw new NotFoundException("Parent not found for Parent");
      }

      return new ParentUserDTO({
        ...user,
        parent,
      });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getStudentUserDto = async (user: IUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Child) {
        throw new UnauthorizedException("User is not a Student");
      }

      const student = await StudentService.findStudentByUserId(user.id, tx);

      if (!student) {
        throw new NotFoundException("Student not found for Student");
      }

      return new StudentUserDTO({
        ...user,
        student,
      });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static updateProfileImage = async (user: IUser, dto: UpdateProfileImageDTO, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      await CloudinaryService.assertValidImageAsset(dto.publicId);

      await UsersService.updateUser({ userId: user.id, update: { avatarPublicId: dto.publicId }, txInstance: tx });

      await CloudinaryService.moveImageFromTempFolder(dto.publicId, user.id, ImageType.AVATAR);

      return CloudinaryService.getAssetUrl(dto.publicId);
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };
}
