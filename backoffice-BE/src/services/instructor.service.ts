import { isAfter } from "date-fns";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import * as dbService from "../db/index.js";
import { Transaction } from "../db/index.js";
import { InstructorInviteDetailsDTO } from "../dtos/instructor.dtos.js";
import {
  IDojoInstructor,
  InstructorsRepository,
} from "../repositories/instructors.repository.js";
import { InvitesRepository } from "../repositories/invites.repository.js";
import { HttpException } from "../core/errors/HttpException.js";
import { InstructorInviteStatus } from "../constants/enums.js";
import { hashToken } from "../utils/auth.utils.js";
import { DeclineInviteDTO } from "../validations/instructors.schemas.js";
import { ConflictException } from "../core/errors/ConflictException.js";

export class InstructorService {
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
        throw new ConflictException(
          `Invite has already been ${invite.status}`
        );
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
        throw new ConflictException(
          `Invite has already been ${invite.status}`
        );
      }

      await InvitesRepository.markInviteAsDeclined(invite.id, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
