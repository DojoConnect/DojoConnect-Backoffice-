import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  Mocked,
} from "vitest";
import type { MockInstance } from "vitest";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies.js";
import { ClassService } from "./class.service.js";
import {
  buildClassMock,
  buildCreateClassDTOMock,
} from "../tests/factories/class.factory.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import {
  ClassFrequency,
  ClassSubscriptionType,
} from "../constants/enums.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { nextDay } from "date-fns";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { StripeService } from "./stripe.service.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildInstructorMock } from "../tests/factories/instructor.factory.js";

vi.mock("date-fns");
vi.mock("../utils/date.utils.js");
vi.mock("../repositories/instructors.repository.js");
vi.mock("./stripe.service.js");
vi.mock("./notifications.service.js");
vi.mock("./users.service.js");

describe("Class Service", () => {
  const mockedNextDay = vi.mocked(nextDay);
  const mockedMapWeekdayToDayNumber = vi.mocked(mapWeekdayToDayNumber);
  let dbServiceSpy: DbServiceSpies;

  // Spies for external services and repositories
  let findInstructorSpy: MockInstance;
  let createStripeProdSpy: MockInstance;
  let createStripePriceSpy: MockInstance;
  let updateClassRepoSpy: MockInstance;
  let getUserByIdSpy: MockInstance;
  let notifyOwnerSpy: MockInstance;

  beforeEach(() => {
    dbServiceSpy = createDrizzleDbSpies();
    vi.useFakeTimers();

    // Setup spies
    findInstructorSpy = vi.spyOn(
      InstructorsRepository,
      "findOneByIdAndDojoId"
    );
    createStripeProdSpy = vi.spyOn(StripeService, "createClassProduct");
    createStripePriceSpy = vi.spyOn(StripeService, "createClassPrice");
    updateClassRepoSpy = vi.spyOn(ClassRepository, "update");
    getUserByIdSpy = vi.spyOn(UsersService, "getOneUserByID");
    notifyOwnerSpy = vi.spyOn(
      NotificationService,
      "notifyDojoOwnerOfClassCreation"
    );

    // Default happy path mocks
    getUserByIdSpy.mockResolvedValue(buildUserMock());
    notifyOwnerSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("createClass", () => {
    let createClassSpy: MockInstance;
    let findByIdSpy: MockInstance;
    const dojo = buildDojoMock();

    beforeEach(() => {
      createClassSpy = vi
        .spyOn(ClassRepository, "create")
        .mockResolvedValue("new-class-id");
      findByIdSpy = vi
        .spyOn(ClassRepository, "findById")
        .mockResolvedValue(buildClassMock({ dojoId: dojo.id }));
    });

    it("should throw NotFoundException if instructorId is provided but instructor not found", async () => {
      const dto = buildCreateClassDTOMock({ instructorId: "non-existent-ins" });
      findInstructorSpy.mockResolvedValue(null);

      await expect(
        ClassService.createClass({ dto, dojo })
      ).rejects.toThrow(NotFoundException);

      expect(findInstructorSpy).toHaveBeenCalledWith(
        "non-existent-ins",
        dojo.id,
        dbServiceSpy.mockTx
      );
    });

    it("should successfully create a class when a valid instructorId is provided", async () => {
      const instructor = buildInstructorMock();
      const dto = buildCreateClassDTOMock({ instructorId: instructor.id });
      findInstructorSpy.mockResolvedValue(instructor);

      await ClassService.createClass({ dto, dojo });

      expect(findInstructorSpy).toHaveBeenCalledWith(
        instructor.id,
        dojo.id,
        dbServiceSpy.mockTx
      );
      expect(createClassSpy).toHaveBeenCalled();
    });

    describe("for a paid weekly class", () => {
      it("should create stripe product and price, and update the class", async () => {
        const dto = buildCreateClassDTOMock({
          frequency: ClassFrequency.Weekly,
          subscriptionType: ClassSubscriptionType.Paid,
          price: 50,
        });

        const stripeProd = { id: "prod_123" };
        const stripePrice = { id: "price_123" };
        createStripeProdSpy.mockResolvedValue(stripeProd as any);
        createStripePriceSpy.mockResolvedValue(stripePrice as any);
        updateClassRepoSpy.mockResolvedValue(undefined);

        await ClassService.createClass({ dto, dojo });

        expect(createStripeProdSpy).toHaveBeenCalledWith(dto.name, dojo.id);
        expect(createStripePriceSpy).toHaveBeenCalledWith(stripeProd.id, dto.price);
        expect(updateClassRepoSpy).toHaveBeenCalledWith({
          classId: "new-class-id",
          update: { stripePriceId: stripePrice.id },
          tx: dbServiceSpy.mockTx,
        });
      });
    });

    it("should notify the dojo owner upon class creation", async () => {
        const owner = buildUserMock({ id: dojo.ownerUserId });
        getUserByIdSpy.mockResolvedValue(owner);
        const dto = buildCreateClassDTOMock();
  
        await ClassService.createClass({ dto, dojo });
  
        expect(getUserByIdSpy).toHaveBeenCalledWith({
          userId: dojo.ownerUserId,
          txInstance: dbServiceSpy.mockTx,
        });
        expect(notifyOwnerSpy).toHaveBeenCalledWith({
          className: dto.name,
          dojoOwner: owner,
        });
      });
  });

  describe("getOneClassById", () => {
    let findByIdSpy: MockInstance;

    beforeEach(() => {
      findByIdSpy = vi.spyOn(ClassRepository, "findById");
    });

    it("should return a class object when found", async () => {
      const mockClass = buildClassMock();
      findByIdSpy.mockResolvedValue(mockClass);

      const result = await ClassService.getOneClassById("class-1");

      expect(result).toEqual(mockClass);
      expect(findByIdSpy).toHaveBeenCalledWith(
        "class-1",
        dbServiceSpy.mockTx
      );
    });

    it("should throw NotFoundException when class is not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        ClassService.getOneClassById("non-existent-id")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAllClassesByDojoId", () => {
    let findAllByDojoIdSpy: MockInstance;

    beforeEach(() => {
      findAllByDojoIdSpy = vi.spyOn(ClassRepository, "findAllByDojoId");
    });

    it("should return an array of classes", async () => {
      const dojoId = "dojo-1";
      const mockClasses = [
        buildClassMock({ dojoId }),
        buildClassMock({ dojoId, id: "class-2" }),
      ];
      findAllByDojoIdSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getAllClassesByDojoId(dojoId);

      expect(result).toEqual(mockClasses);
      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(
        dojoId,
        dbServiceSpy.mockTx
      );
    });
  });

  describe("updateClass", () => {
    it("should call ClassRepository.update with correct parameters", async () => {
        updateClassRepoSpy = vi.spyOn(ClassRepository, "update").mockResolvedValue();
        const classId = "class-1";
        const update = { name: "Updated Class Name" };
  
        await ClassService.updateClass({ classId, update });
  
        expect(updateClassRepoSpy).toHaveBeenCalledWith({
          classId,
          update,
          tx: dbServiceSpy.mockTx,
        });
      });
  });
});
