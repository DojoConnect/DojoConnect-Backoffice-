import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  MockInstance,
} from "vitest";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies.js";
import { ClassService } from "./class.service.js";
import {
  buildClassMock,
  buildCreateClassDTOMock,
} from "../tests/factories/class.factory.js";
import { ClassRepository, IUpdateClass } from "../repositories/class.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import {
  ClassFrequency,
  ClassSubscriptionType,
  Weekday,
} from "../constants/enums.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { StripeService } from "./stripe.service.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildInstructorMock } from "../tests/factories/instructor.factory.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { CloudinaryResourceType, ImageType } from "../constants/cloudinary.js";
import { nextDay } from "date-fns";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { buildStripePriceMock, buildStripeProductMock } from "../tests/factories/stripe.factory.js";

vi.mock("date-fns");
vi.mock("../utils/date.utils.js");
vi.mock("../repositories/class.repository.js");
vi.mock("../repositories/instructors.repository.js");
vi.mock("./stripe.service.js");
vi.mock("./notifications.service.js");
vi.mock("./users.service.js");
vi.mock("./cloudinary.service.js");

describe("Class Service", () => {
  let dbServiceSpy: DbServiceSpies;

  // Mocks
  const dojo = buildDojoMock();
  const owner = buildUserMock({ id: dojo.ownerUserId });
  const instructor = buildInstructorMock({ dojoId: dojo.id });
  const instructorProfile = buildUserMock({ id: instructor.instructorUserId });
  const newClassId = "new-class-id";

  // Spies
  let findInstructorSpy: MockInstance;
  let createStripeProdSpy: MockInstance;
  let createStripePriceSpy: MockInstance;
  let getUserByIdSpy: MockInstance;
  let notifyOwnerSpy: MockInstance;
  let notifyInstructorSpy: MockInstance;
  let fetchImageAssetSpy: MockInstance;
  let moveImageSpy: MockInstance;
  let createClassRepoSpy: MockInstance;
  let findClassByIdRepoSpy: MockInstance;
  let updateClassRepoSpy: MockInstance;
  const mockedNextDay = vi.mocked(nextDay);
  const mockedMapWeekdayToDayNumber = vi.mocked(mapWeekdayToDayNumber);

  beforeEach(() => {
    dbServiceSpy = createDrizzleDbSpies();
    vi.useFakeTimers();

    // Mock external dependencies
    findInstructorSpy = vi
      .spyOn(InstructorsRepository, "findOneByIdAndDojoId")
      .mockResolvedValue(instructor);
    createStripeProdSpy = vi
      .spyOn(StripeService, "createClassProduct")
      .mockResolvedValue(buildStripeProductMock({ id: "prod_123" }));
    createStripePriceSpy = vi
      .spyOn(StripeService, "createClassPrice")
      .mockResolvedValue(buildStripePriceMock({ id: "price_123" }));
    getUserByIdSpy = vi.spyOn(UsersService, "getOneUserByID");
    notifyOwnerSpy = vi.spyOn(
      NotificationService,
      "notifyDojoOwnerOfClassCreation"
    );
    notifyInstructorSpy = vi.spyOn(
      NotificationService,
      "notifyInstructorOfNewClassAssigned"
    );
    fetchImageAssetSpy = vi
      .spyOn(CloudinaryService, "fetchImageAsset")
      .mockResolvedValue({
        resource_type: CloudinaryResourceType.IMAGE,
      } as any);
    moveImageSpy = vi.spyOn(CloudinaryService, "moveImageFromTempFolder");
    createClassRepoSpy = vi
      .spyOn(ClassRepository, "create")
      .mockResolvedValue(newClassId);
    findClassByIdRepoSpy = vi
      .spyOn(ClassRepository, "findById")
      .mockResolvedValue(buildClassMock());
    updateClassRepoSpy = vi.spyOn(ClassRepository, "update");

    // Default happy path mocks
    getUserByIdSpy.mockImplementation(({ userId }) => {
      if (userId === dojo.ownerUserId) return Promise.resolve(owner);
      if (userId === instructor.instructorUserId)
        return Promise.resolve(instructorProfile);
      return Promise.resolve(buildUserMock());
    });
    mockedMapWeekdayToDayNumber.mockReturnValue(1); // Monday
    mockedNextDay.mockReturnValue(new Date("2023-01-02T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("createClass", () => {
    it("should throw NotFoundException if imagePublicId is provided but asset not found", async () => {
      const dto = buildCreateClassDTOMock({ imagePublicId: "non-existent" });
      fetchImageAssetSpy.mockResolvedValue(null);
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException if asset is not an image", async () => {
      const dto = buildCreateClassDTOMock({ imagePublicId: "video-id" });
      fetchImageAssetSpy.mockResolvedValue({ resource_type: "video" } as any);
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw NotFoundException if instructorId is provided but not found", async () => {
      const dto = buildCreateClassDTOMock({ instructorId: "ghost" });
      findInstructorSpy.mockResolvedValue(null);
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
        new NotFoundException("Instructor with ID ghost not found for Dojo")
      );
    });

    it("should move image from temp folder if imagePublicId is provided", async () => {
      const imagePublicId = "temp-img-id";
      const dto = buildCreateClassDTOMock({ imagePublicId });
      await ClassService.createClass({ dto, dojo });
      expect(moveImageSpy).toHaveBeenCalledWith(
        imagePublicId,
        dojo.id,
        ImageType.CLASS
      );
    });

    it("should create a class with correct data for a one-time schedule", async () => {
      const scheduleDate = new Date("2024-08-15T10:00:00.000Z");
      const dto = buildCreateClassDTOMock({
        frequency: ClassFrequency.OneTime,
        schedules: [
          {
            type: ClassFrequency.OneTime,
            date: scheduleDate,
            startTime: "10:00",
            endTime: "11:00",
          },
        ],
      });
      await ClassService.createClass({ dto, dojo });
      expect(createClassRepoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          schedulesData: [
            expect.objectContaining({ initialClassDate: scheduleDate }),
          ],
        }),
        dbServiceSpy.mockTx
      );
    });

    it("should create a class with correct data for a weekly schedule", async () => {
      const dto = buildCreateClassDTOMock({
        frequency: ClassFrequency.Weekly,
        schedules: [{
          type: ClassFrequency.Weekly,
          weekday: Weekday.Tuesday,
          startTime: "18:00",
          endTime: "19:00",
        }],
      });
      const expectedDate = new Date("2023-01-02T10:00:00.000Z");
      mockedNextDay.mockReturnValue(expectedDate);
      await ClassService.createClass({ dto, dojo });
      expect(mockedMapWeekdayToDayNumber).toHaveBeenCalledWith(Weekday.Tuesday);
      expect(createClassRepoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          schedulesData: [
            expect.objectContaining({ initialClassDate: expectedDate }),
          ],
        }),
        dbServiceSpy.mockTx
      );
    });

    describe("for a paid weekly class", () => {
      it("should create stripe product and price, and update the class", async () => {
        const dto = buildCreateClassDTOMock({
          frequency: ClassFrequency.Weekly,
          subscriptionType: ClassSubscriptionType.Paid,
          price: 50,
        });

        const createdClass = buildClassMock({ dojoId: dojo.id, id: newClassId });
        findClassByIdRepoSpy.mockResolvedValue(createdClass);
        await ClassService.createClass({ dto, dojo });

        expect(createStripeProdSpy).toHaveBeenCalledWith(dto.name, dojo.id);
        expect(createStripePriceSpy).toHaveBeenCalledWith("prod_123", dto.price);
        expect(updateClassRepoSpy).toHaveBeenCalledWith({
          classId: newClassId,
          update: { stripePriceId: "price_123" },
          tx: dbServiceSpy.mockTx,
        });
      });

      it("should throw BadRequestException if price is not provided", async () => {
        const dto = buildCreateClassDTOMock({
          frequency: ClassFrequency.Weekly,
          subscriptionType: ClassSubscriptionType.Paid,
          price: undefined,
        });
        await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
          new BadRequestException("Price is required for paid classes")
        );
      });
    });

    it("should notify the dojo owner upon class creation", async () => {
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

    it("should notify the assigned instructor", async () => {
      const dto = buildCreateClassDTOMock({ instructorId: instructor.id });
      await ClassService.createClass({ dto, dojo });
      expect(getUserByIdSpy).toHaveBeenCalledWith({
        userId: instructor.instructorUserId,
        txInstance: dbServiceSpy.mockTx,
      });
      expect(notifyInstructorSpy).toHaveBeenCalledWith({
        className: dto.name,
        instructor: instructorProfile,
      });
    });

    it("should throw InternalServerErrorException if dojo owner not found", async () => {
        const dto = buildCreateClassDTOMock();
        getUserByIdSpy.mockImplementation(({ userId }) => {
            if (userId === dojo.ownerUserId) return Promise.resolve(null);
            return Promise.resolve(buildUserMock());
        });
        await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
            new InternalServerErrorException("Dojo owner not found")
        );
    });
    
    it("should throw InternalServerErrorException if instructor profile not found", async () => {
        const dto = buildCreateClassDTOMock({ instructorId: instructor.id });
        getUserByIdSpy.mockImplementation(({ userId }) => {
            if (userId === dojo.ownerUserId) return Promise.resolve(owner);
            if (userId === instructor.instructorUserId) return Promise.resolve(null);
            return Promise.resolve(buildUserMock());
        });
        await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
            new InternalServerErrorException("Dojo Instructor not found")
        );
    });
  });

  describe("getOneClassById", () => {
    it("should return a class object when found", async () => {
        const mockClass = buildClassMock();
        findClassByIdRepoSpy.mockResolvedValue(mockClass);
        const result = await ClassService.getOneClassById(mockClass.id);
        expect(result).toEqual(mockClass);
        expect(findClassByIdRepoSpy).toHaveBeenCalledWith(mockClass.id, dbServiceSpy.mockTx);
    });

    it("should throw NotFoundException when class is not found", async () => {
        findClassByIdRepoSpy.mockResolvedValue(null);
        await expect(ClassService.getOneClassById("non-existent-id")).rejects.toThrow(
            new NotFoundException("Class with ID non-existent-id not found.")
        );
    });
  });

  describe("getAllClassesByDojoId", () => {
      let findAllByDojoIdSpy: MockInstance;
      beforeEach(() => {
          findAllByDojoIdSpy = vi.spyOn(ClassRepository, "findAllByDojoId");
      })
    it("should return an array of classes", async () => {
      const mockClasses = [buildClassMock(), buildClassMock({id: "class-2"})];
      findAllByDojoIdSpy.mockResolvedValue(mockClasses);
      const result = await ClassService.getAllClassesByDojoId(dojo.id);
      expect(result).toEqual(mockClasses);
      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(dojo.id, dbServiceSpy.mockTx);
    });
  });

  describe("updateClass", () => {
    it("should call ClassRepository.update with correct parameters", async () => {
        const classId = "class-1";
        const update: IUpdateClass = { name: "Updated Name" };
        await ClassService.updateClass({ classId, update, txInstance: dbServiceSpy.mockTx });
        expect(updateClassRepoSpy).toHaveBeenCalledWith({ classId, update, tx: dbServiceSpy.mockTx });
    });
  });
});