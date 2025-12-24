import { ConflictException } from "../core/errors/ConflictException.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { IUser } from "../repositories/user.repository.js";


export function assertDojoOwnership(dojo: IDojo, user: IUser): asserts dojo {
  if (dojo.userId !== user.id) {
    throw new ConflictException(
      `Dojo ownership mismatch: Dojo ${dojo.userId} does not belong to User ${user.id}`
    );
  }
}