import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertDojoOwnership } from "./assertions.utils.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { ConflictException } from "../core/errors/index.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { IUser } from "../repositories/user.repository.js";

describe("Assertions Utils", () => {
  let user: IUser;
  let dojo: IDojo;

  beforeEach(() => {
    user = buildUserMock();
    dojo = buildDojoMock({ userId: user.id });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("assertDojoOwnership", () => {
    it("should not throw an error if the dojo belongs to the user", () => {
      expect(() => assertDojoOwnership(dojo, user)).not.toThrow();
    });

    it("should throw ConflictException if the dojo does not belong to the user", () => {
      const anotherUser = buildUserMock();
      expect(() => assertDojoOwnership(dojo, anotherUser)).toThrow(
        ConflictException
      );
    });
  });
});
