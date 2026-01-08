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
import { ClassRepository } from "../repositories/class.repository.js";
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
import {
  buildStripePriceMock,
  buildStripeProductMock,
} from "../tests/factories/stripe.factory.js";
import {
  CreateClassScheduleDTO,
  UpdateClassDTO,
} from "../validations/classes.schemas.js";
import { ForbiddenException } from "../core/errors/ForbiddenException.js";
import { UserRepository } from "../repositories/user.repository.js";

vi.mock("date-fns");
vi.mock("../utils/date.utils.js");
vi.mock("../repositories/class.repository.js");
vi.mock("../repositories/instructors.repository.js");
vi.mock("./stripe.service.js");
vi.mock("./notifications.service.js");
vi.mock("./users.service.js");
vi.mock("./cloudinary.service.js");
vi.mock("../repositories/user.repository.js");

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
  let archiveStripePriceSpy: MockInstance;
  let retrieveStripePriceSpy: MockInstance;
  let getUserByIdSpy: MockInstance;
  let notifyOwnerSpy: MockInstance;
  let notifyInstructorSpy: MockInstance;
  let fetchImageAssetSpy: MockInstance;
  let moveImageSpy: MockInstance;
  let createClassRepoSpy: MockInstance;
  let findClassByIdRepoSpy: MockInstance;
  let updateClassRepoSpy: MockInstance;
  let deleteSchedulesRepoSpy: MockInstance;
  let createSchedulesRepoSpy: MockInstance;
  let fetchClassSchedulesRepoSpy: MockInstance;
  let userProfileForInstructorSpy: MockInstance;
  let userProfileByInstructorIdsSpy: MockInstance;
  let getClassInfoSpy: MockInstance;

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
    archiveStripePriceSpy = vi.spyOn(StripeService, "archivePrice");
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
    deleteSchedulesRepoSpy = vi.spyOn(ClassRepository, "deleteSchedules");
    createSchedulesRepoSpy = vi.spyOn(ClassRepository, "createSchedules");
    fetchClassSchedulesRepoSpy = vi.spyOn(
      ClassRepository,
      "fetchClassSchedules"
    );
    retrieveStripePriceSpy = vi
      .spyOn(StripeService, "retrievePrice")
      .mockResolvedValue(buildStripePriceMock());
    userProfileForInstructorSpy = vi.spyOn(
      UserRepository,
      "getUserProfileForInstructor"
    );
    userProfileByInstructorIdsSpy = vi.spyOn(
      UserRepository,
      "getUserProfileByInstructorIds"
    );
    getClassInfoSpy = vi
      .spyOn(ClassService, "getClassInfo")
      .mockResolvedValue({} as any);

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
        schedules: [
          {
            type: ClassFrequency.Weekly,
            weekday: Weekday.Tuesday,
            startTime: "18:00",
            endTime: "19:00",
          },
        ],
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

        await ClassService.createClass({ dto, dojo });

        expect(createStripeProdSpy).toHaveBeenCalledWith(dto.name, dojo.id);
        expect(createStripePriceSpy).toHaveBeenCalledWith(
          "prod_123",
          dto.price
        );
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
        if (userId === instructor.instructorUserId)
          return Promise.resolve(null);
        return Promise.resolve(buildUserMock());
      });
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
        new InternalServerErrorException("Dojo Instructor not found")
      );
    });
  });

  describe("updateClass", () => {
    const classId = "class-to-update";

    it("should throw NotFoundException if class does not exist", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);
      const dto: UpdateClassDTO = { name: "New Name" };

      await expect(
        ClassService.updateClass({ classId, dojoId: dojo.id, dto })
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if class does not belong to the dojo", async () => {
      const existingClass = buildClassMock({
        id: classId,
        dojoId: "another-dojo",
      });
      findClassByIdRepoSpy.mockResolvedValue(existingClass);
      const dto: UpdateClassDTO = { name: "New Name" };

      await expect(
        ClassService.updateClass({ classId, dojoId: dojo.id, dto })
      ).rejects.toThrow(ForbiddenException);
    });

    it("should update basic class details", async () => {
      const existingClass = buildClassMock({ id: classId, dojoId: dojo.id });
      findClassByIdRepoSpy.mockResolvedValue(existingClass);
      const dto: UpdateClassDTO = { name: "Updated Class Name", capacity: 30 };

      await ClassService.updateClass({ classId, dojoId: dojo.id, dto });

      expect(updateClassRepoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          classId,
          update: expect.objectContaining({
            name: "Updated Class Name",
            capacity: 30,
          }),
        })
      );
    });

    it("should update schedules for a weekly class", async () => {
      const existingClass = buildClassMock({
        id: classId,
        dojoId: dojo.id,
        frequency: ClassFrequency.Weekly,
      });
      findClassByIdRepoSpy.mockResolvedValue(existingClass);
      const dto: UpdateClassDTO = {
        schedules: [
          {
            type: ClassFrequency.Weekly,
            weekday: Weekday.Friday,
            startTime: "20:00",
            endTime: "21:00",
          },
        ],
      };

      await ClassService.updateClass({ classId, dojoId: dojo.id, dto });

      expect(deleteSchedulesRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
      expect(createSchedulesRepoSpy).toHaveBeenCalled();
    });

    describe("price and subscription updates", () => {
      it("should transition a class from Free to Paid", async () => {
        const existingClass = buildClassMock({
          id: classId,
          dojoId: dojo.id,
          subscriptionType: ClassSubscriptionType.Free,
          price: "0",
        });
        findClassByIdRepoSpy.mockResolvedValue(existingClass);

        const dto: UpdateClassDTO = {
          subscriptionType: ClassSubscriptionType.Paid,
          price: 100,
        };

        await ClassService.updateClass({ classId, dojoId: dojo.id, dto });

        expect(createStripeProdSpy).toHaveBeenCalledWith(
          existingClass.name,
          dojo.id
        );
        expect(createStripePriceSpy).toHaveBeenCalledWith("prod_123", 100);
        expect(updateClassRepoSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({ stripePriceId: "price_123" }),
          })
        );
      });

      it("should transition a class from Paid to Free", async () => {
        const existingClass = buildClassMock({
          id: classId,
          dojoId: dojo.id,
          subscriptionType: ClassSubscriptionType.Paid,
          price: "100",
          stripePriceId: "price_to_archive",
        });
        findClassByIdRepoSpy.mockResolvedValue(existingClass);

        const dto: UpdateClassDTO = {
          subscriptionType: ClassSubscriptionType.Free,
        };

        await ClassService.updateClass({ classId, dojoId: dojo.id, dto });

        expect(archiveStripePriceSpy).toHaveBeenCalledWith("price_to_archive");
        expect(updateClassRepoSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({
              stripePriceId: null,
              price: "0",
            }),
          })
        );
      });

      it("should change the price for a Paid class", async () => {
        const existingClass = buildClassMock({
          id: classId,
          dojoId: dojo.id,
          subscriptionType: ClassSubscriptionType.Paid,
          price: "100",
          stripePriceId: "price_to_archive",
        });
        findClassByIdRepoSpy.mockResolvedValue(existingClass);
        createStripePriceSpy.mockResolvedValue(
          buildStripePriceMock({ id: "price_456" })
        );

        const dto: UpdateClassDTO = { price: 150 };

        await ClassService.updateClass({ classId, dojoId: dojo.id, dto });

        expect(archiveStripePriceSpy).toHaveBeenCalledWith("price_to_archive");
        expect(createStripePriceSpy).toHaveBeenCalledWith("prod_123", 150);
        expect(updateClassRepoSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({ stripePriceId: "price_456" }),
          })
        );
      });
    });
  });

  describe("updateClassInstructor", () => {
    it("should call updateClass with the correct parameters", async () => {
      const classId = "class-123";
      const dojoId = dojo.id;
      const instructorId = "instructor-456";

      // Spy on the method we expect to be called
      const updateClassSpy = vi
        .spyOn(ClassService, "updateClass")
        .mockResolvedValue({} as any); // Mock the return value

      await ClassService.updateClassInstructor({
        classId,
        dojoId,
        instructorId,
      });

      expect(updateClassSpy).toHaveBeenCalledWith(
        {
          classId,
          dojoId,
          dto: { instructorId },
        },
        undefined // expecting txInstance to be undefined when not passed
      );
    });
  });

  describe("getAllClassesByDojoId", () => {
    let findAllByDojoIdSpy: MockInstance;
    beforeEach(() => {
      findAllByDojoIdSpy = vi.spyOn(ClassRepository, "findAllByDojoId");
    });
    it("should return classes with merged instructor details", async () => {
      const instructor2 = buildInstructorMock({ dojoId: dojo.id });
      const instructorProfile2 = buildUserMock({
        id: instructor2.instructorUserId,
      });

      const mockClasses = [
        buildClassMock({ instructorId: instructor.id }),
        buildClassMock({ id: "class-2", instructorId: instructor2.id }),
        buildClassMock({ id: "class-3", instructorId: null }),
      ];

      const mockInstructorProfiles = [
        { ...instructorProfile, instructorId: instructor.id },
        { ...instructorProfile2, instructorId: instructor2.id },
      ];

      findAllByDojoIdSpy.mockResolvedValue(mockClasses);
      userProfileByInstructorIdsSpy.mockResolvedValue(mockInstructorProfiles);

      const result = await ClassService.getAllClassesByDojoId(dojo.id);

      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(
        dojo.id,
        dbServiceSpy.mockTx
      );
      expect(userProfileByInstructorIdsSpy).toHaveBeenCalledWith(
        [instructor.id, instructor2.id],
        dbServiceSpy.mockTx
      );

      expect(result.length).toBe(3);
      expect(result[0].instructor).toBeDefined();
      expect(result[0].instructor?.firstName).toEqual(
        instructorProfile.firstName
      );
      expect(result[1].instructor).toBeDefined();
      expect(result[1].instructor?.firstName).toEqual(
        instructorProfile2.firstName
      );
      expect(result[2].instructor).toBeNull();
    });
  });

  describe("fetchClassAndSchedules", () => {
    const classId = "test-class-id";

    it("should return null if the class is not found", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);

      const result = await ClassService.fetchClassAndSchedules(classId);

      expect(result).toBeNull();
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
      expect(fetchClassSchedulesRepoSpy).not.toHaveBeenCalled();
    });

    it("should return the class with its schedules if found", async () => {
      const mockClass = buildClassMock({ id: classId });
      const mockSchedules = [
        {
          id: "schedule-1",
          classId,
          weekday: Weekday.Monday,
          startTime: "10:00",
          endTime: "11:00",
          initialClassDate: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      findClassByIdRepoSpy.mockResolvedValue(mockClass);
      fetchClassSchedulesRepoSpy.mockResolvedValue(mockSchedules);

      const result = await ClassService.fetchClassAndSchedules(classId);

      expect(result).toEqual({
        ...mockClass,
        schedules: mockSchedules,
      });
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
      expect(fetchClassSchedulesRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
    });
  });

  describe("mapCreateClassScheduleDTOToINewClassSchedule", () => {
    it("should correctly map a OneTime schedule", () => {
      const scheduleDate = new Date("2025-01-01T12:00:00.000Z");
      const dto: CreateClassScheduleDTO = [
        {
          type: ClassFrequency.OneTime,
          date: scheduleDate,
          startTime: "12:00",
          endTime: "13:00",
        },
      ];

      const result =
        ClassService.mapCreateClassScheduleDTOToINewClassSchedule(dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: scheduleDate,
        initialClassDate: scheduleDate,
        startTime: "12:00",
        endTime: "13:00",
      });
    });

    it("should correctly map a Weekly schedule", () => {
      const dto: CreateClassScheduleDTO = [
        {
          type: ClassFrequency.Weekly,
          weekday: Weekday.Wednesday,
          startTime: "18:00",
          endTime: "19:00",
        },
      ];

      const expectedDate = new Date("2023-01-04T10:00:00.000Z"); // Mocked nextDay will return this
      mockedNextDay.mockReturnValue(expectedDate);
      mockedMapWeekdayToDayNumber.mockReturnValue(3); // Wednesday

      const result =
        ClassService.mapCreateClassScheduleDTOToINewClassSchedule(dto);

      expect(result).toHaveLength(1);
      expect(mockedMapWeekdayToDayNumber).toHaveBeenCalledWith(Weekday.Wednesday);
      expect(mockedNextDay).toHaveBeenCalledWith(expect.any(Date), 3);
      expect(result[0]).toEqual({
        initialClassDate: expectedDate,
        weekday: Weekday.Wednesday,
        startTime: "18:00",
        endTime: "19:00",
      });
    });

    it("should return an empty array if the input is empty", () => {
      const result =
        ClassService.mapCreateClassScheduleDTOToINewClassSchedule([]);
      expect(result).toEqual([]);
    });
  });

  describe("assertValidClassImage", () => {
    it("should not throw an error for a valid image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: CloudinaryResourceType.IMAGE,
      } as any);

      await expect(
        ClassService.assertValidClassImage("valid-image-id")
      ).resolves.not.toThrow();
    });

    it("should throw NotFoundException if asset is not found", async () => {
      fetchImageAssetSpy.mockResolvedValue(null);

      await expect(
        ClassService.assertValidClassImage("not-found-id")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if asset is not an image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: "video",
      } as any);

      await expect(
        ClassService.assertValidClassImage("video-id")
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("assertInstructorExistInDojo", () => {
    const instructorId = "test-instructor-id";
    const dojoId = "test-dojo-id";

    it("should return the instructor if they exist in the dojo", async () => {
      const mockInstructor = buildInstructorMock({
        id: instructorId,
        dojoId: dojoId,
      });
      findInstructorSpy.mockResolvedValue(mockInstructor);

      const result = await ClassService.assertInstructorExistInDojo(
        instructorId,
        dojoId,
        dbServiceSpy.mockTx
      );

      expect(result).toEqual(mockInstructor);
      expect(findInstructorSpy).toHaveBeenCalledWith(
        instructorId,
        dojoId,
        dbServiceSpy.mockTx
      );
    });

    it("should throw NotFoundException if instructor is not found in the dojo", async () => {
      findInstructorSpy.mockResolvedValue(null);

      await expect(
        ClassService.assertInstructorExistInDojo(
          instructorId,
          dojoId,
          dbServiceSpy.mockTx
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getClassInfo", () => {
    const classId = "test-class-id";

    beforeEach(() => {
      // Restore the original implementation of getClassInfo for this suite
      if (getClassInfoSpy) {
        getClassInfoSpy.mockRestore();
      }
    });

    it("should throw NotFoundException if class is not found", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);

      await expect(ClassService.getClassInfo(classId)).rejects.toThrow(
        new NotFoundException(`Class with ID ${classId} not found.`)
      );
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
    });

    it("should return class info without instructor details if class has no instructor", async () => {
      const mockClass = buildClassMock({ id: classId, instructorId: null });
      findClassByIdRepoSpy.mockResolvedValue(mockClass);
      fetchClassSchedulesRepoSpy.mockResolvedValue([]);

      const result = await ClassService.getClassInfo(classId);

      expect(result).toEqual({
        ...mockClass,
        schedules: [],
        instructor: null,
      });
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
      expect(userProfileForInstructorSpy).not.toHaveBeenCalled();
    });

    it("should return class info with instructor details if class has an instructor", async () => {
      const mockInstructorId = "instructor-123";
      const mockClass = buildClassMock({
        id: classId,
        instructorId: mockInstructorId,
      });
      const mockInstructorProfile = {
        firstName: "John",
        lastName: "Doe",
        avatar: "avatar-url",
      };

      findClassByIdRepoSpy.mockResolvedValue(mockClass);
      fetchClassSchedulesRepoSpy.mockResolvedValue([]);
      userProfileForInstructorSpy.mockResolvedValue(mockInstructorProfile);

      const result = await ClassService.getClassInfo(classId);

      expect(result).toEqual({
        ...mockClass,
        schedules: [],
        instructor: {
          id: mockInstructorId,
          ...mockInstructorProfile,
        },
      });
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(
        classId,
        dbServiceSpy.mockTx
      );
      expect(userProfileForInstructorSpy).toHaveBeenCalledWith(
        mockInstructorId,
        dbServiceSpy.mockTx
      );
    });

    it("should throw InternalServerErrorException if instructor user profile is not found", async () => {
      const mockInstructorId = "instructor-123";
      const mockClass = buildClassMock({
        id: classId,
        instructorId: mockInstructorId,
      });
      findClassByIdRepoSpy.mockResolvedValue(mockClass);
      fetchClassSchedulesRepoSpy.mockResolvedValue([]);
      userProfileForInstructorSpy.mockResolvedValue(null);

      await expect(ClassService.getClassInfo(classId)).rejects.toThrow(
        new InternalServerErrorException("Instructor User account not found")
      );
    });
  });
});
