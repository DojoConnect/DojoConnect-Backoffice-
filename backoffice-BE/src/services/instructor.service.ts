import { isAfter } from "date-fns";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import * as dbService from "../db/index.js";
import { Transaction } from "../db/index.js";
import { InstructorInviteDetailsDTO } from "../dtos/instructor.dtos.js";
import {
  IDojoInstructor,
  InstructorsRepository,
} from "../repositories/instructors.repository.js";
import {
  InstructorInviteDetails,
  InvitesRepository,
} from "../repositories/invites.repository.js";
import { HttpException } from "../core/errors/HttpException.js";
import { InstructorInviteStatus, Role } from "../constants/enums.js";
import { hashToken } from "../utils/auth.utils.js";
import {
  AcceptInviteDTO,
  DeclineInviteDTO,
} from "../validations/instructors.schemas.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { UsersService } from "./users.service.js";
import { NotificationService } from "./notifications.service.js";
import { AuthService } from "./auth.service.js";
import { IUser, UserRepository } from "../repositories/user.repository.js";
import { MailerService } from "./mailer.service.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";

export class InstructorService {
  static getOneById = async (
    instructorId: string,
    txInstance?: Transaction
  ) => {
    const execute = async (tx: Transaction) => {
      return await InstructorsRepository.findOneById(instructorId, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static findInstructorByUserId = async (
    userId: string,
    txInstance?: Transaction
  ): Promise<IDojoInstructor | null> => {
    const execute = async (tx: Transaction) => {
      return await InstructorsRepository.findOneByUserId(userId, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getInviteDetails = async (
    token: string,
    txInstance?: Transaction
  ): Promise<InstructorInviteDetailsDTO | null> => {
    const execute = async (tx: Transaction) => {
      const tokenHash = hashToken(token);
      const invite = await InvitesRepository.getInviteDetails(tokenHash, tx);

      if (!invite) {
        throw new NotFoundException("Invite not found");
      }

      if (isAfter(new Date(), invite.expiresAt)) {
        await InvitesRepository.markInviteAsExpired(invite.id, tx);

        throw new HttpException(410, "Invite has expired");
      }

      if (invite.status !== InstructorInviteStatus.Pending) {
        throw new ConflictException(`Invite has already been ${invite.status}`);
      }

      return new InstructorInviteDetailsDTO(invite);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static declineInvite = async (
    dto: DeclineInviteDTO,
    txInstance?: Transaction
  ): Promise<void> => {
    const execute = async (tx: Transaction) => {
      const tokenHash = hashToken(dto.token);
      const invite = await InvitesRepository.getInviteDetails(tokenHash, tx);

      if (!invite) {
        throw new NotFoundException("Invite not found");
      }

      if (invite.status !== InstructorInviteStatus.Pending) {
        throw new ConflictException(`Invite has already been ${invite.status}`);
      }

      await InvitesRepository.markInviteAsResponded(
        invite.id,
        InstructorInviteStatus.Declined,
        tx
      );

      // Notify the inviter about the decline
      await this.notifyDojoOwnerOfResponse({
        tx,
        invite,
        response: InstructorInviteStatus.Declined,
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static acceptInvite = async (
    dto: AcceptInviteDTO,
    txInstance?: Transaction
  ): Promise<void> => {
    const execute = async (tx: Transaction) => {
      const tokenHash = hashToken(dto.token);
      const invite = await InvitesRepository.getInviteDetails(tokenHash, tx);

      if (!invite) {
        throw new NotFoundException("Invite not found");
      }

      if (invite.status !== InstructorInviteStatus.Pending) {
        throw new ConflictException(`Invite has already been ${invite.status}`);
      }

      if (isAfter(new Date(), invite.expiresAt)) {
        await InvitesRepository.markInviteAsExpired(invite.id, tx);

        throw new HttpException(410, "Invite has expired");
      }

      const newUser = await AuthService.createUser({
        dto: {
          firstName: invite.firstName,
          lastName: invite.lastName,
          email: invite.email,
          password: dto.password,
          // TODO: User should select username when accepting invite
          username: invite.email.split("@")[0],
        },
        role: Role.Instructor,
        tx,
      });

      await this.addInstructorToDojo(newUser, invite.dojoId, tx);

      await InvitesRepository.markInviteAsResponded(
        invite.id,
        InstructorInviteStatus.Accepted,
        tx
      );

      // Notify the inviter about the acceptance
      await this.notifyDojoOwnerOfResponse({
        tx,
        invite,
        response: InstructorInviteStatus.Accepted,
      });

      // Notify Instructor
      await NotificationService.sendInviteAcceptedNotification(newUser, invite);

      await MailerService.sendInviteAcceptedEmail({
        instructor: newUser,
        inviteDetails: invite,
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static addInstructorToDojo = async (
    instructor: IUser,
    dojoId: string,
    txInstance?: Transaction
  ): Promise<void> => {
    const execute = async (tx: Transaction) => {
      if (instructor.role !== Role.Instructor) {
        throw new ConflictException("User is not an instructor");
      }

      await InstructorsRepository.attachInstructorToDojo(
        instructor.id,
        dojoId,
        tx
      );
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static notifyDojoOwnerOfResponse = async ({
    tx,
    invite,
    response,
  }: {
    tx: Transaction;
    invite: InstructorInviteDetails;
    response: InstructorInviteStatus.Accepted | InstructorInviteStatus.Declined;
  }) => {
    const dojoOwner = await UsersService.getOneUserByID({
      userId: invite.dojoOwnerId,
      txInstance: tx,
    });

    if (!dojoOwner) {
      throw new NotFoundException("Dojo owner not found");
    }

    await NotificationService.notifyDojoOwnerOfInviteResponse({
      user: dojoOwner,
      inviteDetails: invite,
      status: response,
    });

    await MailerService.sendInviteResponseEmail({
      dojoOwner,
      inviteDetails: invite,
      response,
    });
  };

  static async getInstructorClasses(
    instructorId: string,
    txInstance?: Transaction
  ): Promise<ClassDTO[]> {
    const execute = async (tx: Transaction) => {
      // TODO: Add pagination
      const classes = await ClassRepository.findAllByInstructorId(
        instructorId,
        tx
      );

      const allBelongsToInstructor = classes
        .map((c) => c.instructorId)
        .every((id) => id === instructorId);

      if (!allBelongsToInstructor) {
        throw new InternalServerErrorException(
          `Classes returned for instructor does not belong to instructor`
        );
      }

      const instructorUserDetails =
        await UserRepository.getUserProfileForInstructor(instructorId, tx);

      if (!instructorUserDetails) {
        throw new InternalServerErrorException(
          "Instructor User account not found"
        );
      }

      return classes.map((c) => {
        return new ClassDTO({
          ...c,
          instructor: instructorUserDetails,
        });
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  }
}
