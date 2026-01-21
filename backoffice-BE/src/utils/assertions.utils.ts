import { ConflictException } from "../core/errors/ConflictException.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { IUser } from "../repositories/user.repository.js";

export function assertDojoOwnership(dojo: IDojo, user: IUser): asserts dojo {
  if (dojo.ownerUserId !== user.id) {
    throw new ConflictException(
      `Dojo ownership mismatch: Dojo ${dojo.ownerUserId} does not belong to User ${user.id}`,
    );
  }
}
