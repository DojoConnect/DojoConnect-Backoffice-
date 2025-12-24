import { InstructorInviteStatus } from "../constants/enums.js";
import {
  IInstructorInvite,
  InstructorInviteDetails,
} from "../repositories/invites.repository.js";
import { getFullName } from "../utils/text.utils.js";

export class InvitedInstructorDTO implements IInstructorInvite {
  id: string;
  dojoId: string;
  email: string;
  firstName: string;
  lastName: string;
  classId: string | null;
  tokenHash: string;
  expiresAt: Date;
  respondedAt: Date | null;
  status: InstructorInviteStatus;
  invitedBy: string;
  createdAt: Date;

  constructor(params: IInstructorInvite) {
    this.id = params.id;
    this.dojoId = params.dojoId;
    this.email = params.email;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.classId = params.classId;
    this.tokenHash = params.tokenHash;
    this.expiresAt = params.expiresAt;
    this.respondedAt = params.respondedAt;
    this.status = params.status;
    this.invitedBy = params.invitedBy;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      dojoId: this.dojoId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      classId: this.classId,
      expiresAt: this.expiresAt,
      status: this.status,
      invitedBy: this.invitedBy,
      createdAt: this.createdAt,
      respondedAt: this.respondedAt,
    };
  }
}

export class InstructorInviteDetailsDTO {
  firstName: string;
  lastName: string;
  email: string;
  expiresAt: Date;
  dojoName: string;
  className: string | null;
  invitedAt: Date;

  constructor(params: InstructorInviteDetails) {
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
    this.expiresAt = params.expiresAt;
    this.dojoName = params.dojoName;
    this.className = params.className;
    this.invitedAt = params.invitedAt;
  }

  toJSON() {
    return {
      name: getFullName(this.firstName, this.lastName),
      email: this.email,
      expiresAt: this.expiresAt,
      dojoName: this.dojoName,
      className: this.className,
      invitedAt: this.invitedAt,
    };
  }
}
