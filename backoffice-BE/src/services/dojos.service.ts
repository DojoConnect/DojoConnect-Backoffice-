import { eq } from "drizzle-orm";
import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import { dojos } from "../db/schema.js";
import {
  DojoRepository,
  IDojo,
  INewDojo,
  IUpdateDojo,
} from "../repositories/dojo.repository.js";
import { InviteInstructorDTO } from "../validations/instructors.schemas.js";
import { IUser } from "../repositories/user.repository.js";
import { assertDojoOwnership } from "../utils/assertions.utils.js";
import { UsersService } from "./users.service.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { InvitesRepository } from "../repositories/invites.repository.js";
import { generateInviteToken, hashToken } from "../utils/auth.utils.js";
import { addDays } from "date-fns";
import { InstructorInviteStatus } from "../constants/enums.js";
import { InstructorService } from "./instructor.service.js";
import { ClassService } from "./class.service.js";
import { MailerService } from "./mailer.service.js";
import { InvitedInstructorDTO } from "../dtos/instructor.dtos.js";

export class DojosService {
  static getOneDojo = async (
    whereClause: any,
    txInstance?: Transaction
  ): Promise<IDojo | null> => {
    const execute = async (tx: Transaction) => {
      return await DojoRepository.getOne(whereClause, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneDojoByTag = async (
    tag: string,
    txInstance?: Transaction
  ): Promise<IDojo | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await DojoRepository.getOneByTag(tag, tx);
      } catch (err: any) {
        console.error(`Error fetching dojo by slug: ${tag}`, { err });
        throw new Error(err);
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneDojoByID = async (
    dojoId: string,
    txInstance?: Transaction
  ): Promise<IDojo | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await DojoRepository.getOneByID(dojoId, tx);
      } catch (err: any) {
        console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
        throw new Error(err);
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneDojoByUserId = async ({
    userId,
    txInstance,
  }: {
    userId: string;
    txInstance?: Transaction;
  }): Promise<IDojo | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await DojosService.getOneDojo(eq(dojos.userId, userId), tx);
      } catch (err: any) {
        console.error(`Error fetching dojo by UserId: ${userId}`, { err });
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static createDojo = async (
    newDojoDTO: INewDojo,
    txInstance?: dbService.Transaction
  ): Promise<IDojo> => {
    const execute = async (tx: Transaction) => {
      const newDojoID = await DojoRepository.create(newDojoDTO, tx);

      return (await DojosService.getOneDojoByID(newDojoID, tx))!;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static updateDojo = async ({
    dojoId,
    update,
    txInstance,
  }: {
    dojoId: string;
    update: IUpdateDojo;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      await DojoRepository.update({ dojoId, update, tx });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static inviteInstructor = async ({
    dto,
    dojo,
    user,
    txInstance,
  }: {
    dojo: IDojo;
    user: IUser;
    dto: InviteInstructorDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // Implementation for inviting an instructor goes here
      // Assert User passed is Dojo Owner
      assertDojoOwnership(dojo, user);

      const existingUser = await UsersService.getOneUserByEmail({
        email: dto.email,
        txInstance: tx,
      });

      if (existingUser) {
        const existingInstructor =
          await InstructorService.findInstructorByUserId(existingUser.id, tx);

        if (existingInstructor) {
          if (existingInstructor.dojoId === dojo.id) {
            throw new ConflictException(
              `User with email ${dto.email} is already an instructor for this dojo`
            );
          }

          throw new ConflictException(
            `User with email ${dto.email} is already an instructor for another dojo`
          );
        }

        throw new ConflictException(
          `User with email ${dto.email} already exists`
        );
      }

      const pendingInvite =
        await InvitesRepository.getOnePendingInviteByEmailAndDojoId(
          dto.email,
          dojo.id,
          tx
        );

      if (pendingInvite) {
        throw new ConflictException(
          `An invite has already been sent to ${dto.email} for this dojo`
        );
      }

      if (dto.classId) {
        const existingClass = await ClassService.getOneClassById(
          dto.classId,
          tx
        );

        if (!existingClass) {
          throw new ConflictException(
            `Class with ID ${dto.classId} does not exist`
          );
        }

        if (existingClass.dojoId !== dojo.id) {
          throw new ConflictException(
            `Class with ID ${dto.classId} does not belong to this dojo`
          );
        }
      }

      // Generate invite token
      const inviteToken = generateInviteToken();
      const hashedToken = hashToken(inviteToken);
      const expiresAt = addDays(new Date(), 7); // Invite valid for 7 days

      await InvitesRepository.createInstructorInvite(
        {
          dojoId: dojo.id,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          classId: dto.classId || null,
          tokenHash: hashedToken,
          expiresAt,
          status: InstructorInviteStatus.Pending,
          invitedBy: user.id,
        },
        tx
      );

      await MailerService.sendInstructorInviteEmail({
        dest: dto.email,
        firstName: dto.firstName,
        dojoName: dojo.name,
        token: inviteToken,
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static fetchInvitedInstructors = async ({
    dojoId,
    txInstance,
  }: {
    dojoId: string;
    txInstance?: Transaction;
  }): Promise<InvitedInstructorDTO[]> => {
    const execute = async (tx: Transaction) => {
      const invites =
        await InvitesRepository.fetchDojoUnacceptedInstructorInvites(
          dojoId,
          tx
        );

      return invites.map((invite) => new InvitedInstructorDTO(invite));
    };
    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
