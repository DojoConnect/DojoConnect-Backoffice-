import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { ClassService } from "./class.service.js";
import { buildClassMock, buildCreateClassDTOMock } from "../tests/factories/class.factory.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { Role } from "../constants/enums.js";
import { ClassFrequency, ClassSubscriptionType, Weekday } from "../constants/enums.js";
import { buildParentMock } from "../tests/factories/parent.factory.js";
import { buildStudentMock } from "../tests/factories/student.factory.js";
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
import {
  CreateClassScheduleDTO,
  UpdateClassDTO,
  UpdateClassSchema,
} from "../validations/classes.schemas.js";
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
vi.mock("../repositories/enrollment.repository.js");
vi.mock("../repositories/student.repository.js");
vi.mock("./chats.service.js");
vi.mock("../repositories/dojo.repository.js");
vi.mock("../repositories/parent.repository.js");

import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { StudentWihUserDTO } from "../dtos/student.dtos.js";
import { DojoRepository } from "../repositories/dojo.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";

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
  let deleteSchedulesRepoSpy: MockInstance;
  let createSchedulesRepoSpy: MockInstance;
  let fetchClassSchedulesRepoSpy: MockInstance;
  let userProfileForInstructorSpy: MockInstance;
  let userProfileByInstructorIdsSpy: MockInstance;
  let getClassSchedulesAndInstructorSpy: MockInstance;

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
    vi.spyOn(StripeService, "archivePrice");
    getUserByIdSpy = vi.spyOn(UsersService, "getOneUserByID");
    notifyOwnerSpy = vi.spyOn(NotificationService, "notifyDojoOwnerOfClassCreation");
    notifyInstructorSpy = vi.spyOn(NotificationService, "notifyInstructorOfNewClassAssigned");
    fetchImageAssetSpy = vi.spyOn(CloudinaryService, "fetchImageAsset").mockResolvedValue({
      resource_type: CloudinaryResourceType.IMAGE,
    } as any);
    moveImageSpy = vi.spyOn(CloudinaryService, "moveImageFromTempFolder");
    createClassRepoSpy = vi.spyOn(ClassRepository, "create").mockResolvedValue(newClassId);
    findClassByIdRepoSpy = vi
      .spyOn(ClassRepository, "findById")
      .mockResolvedValue(buildClassMock());
    updateClassRepoSpy = vi.spyOn(ClassRepository, "update");
    deleteSchedulesRepoSpy = vi.spyOn(ClassRepository, "deleteSchedules");
    createSchedulesRepoSpy = vi.spyOn(ClassRepository, "createSchedules");
    fetchClassSchedulesRepoSpy = vi.spyOn(ClassRepository, "fetchClassSchedules");
    vi
      .spyOn(StripeService, "retrievePrice")
      .mockResolvedValue(buildStripePriceMock());
    userProfileForInstructorSpy = vi.spyOn(UserRepository, "getUserProfileForInstructor");
    userProfileByInstructorIdsSpy = vi.spyOn(UserRepository, "getUserProfileByInstructorIds");
    getClassSchedulesAndInstructorSpy = vi
      .spyOn(ClassService, "getClassSchedulesAndInstructor")
      .mockResolvedValue({} as any);

    // Default happy path mocks
    getUserByIdSpy.mockImplementation(({ userId }) => {
      if (userId === dojo.ownerUserId) return Promise.resolve(owner);
      if (userId === instructor.instructorUserId) return Promise.resolve(instructorProfile);
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
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if asset is not an image", async () => {
      const dto = buildCreateClassDTOMock({ imagePublicId: "video-id" });
      fetchImageAssetSpy.mockResolvedValue({ resource_type: "video" } as any);
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if instructorId is provided but not found", async () => {
      const dto = buildCreateClassDTOMock({ instructorId: "ghost" });
      findInstructorSpy.mockResolvedValue(null);
      await expect(ClassService.createClass({ dto, dojo })).rejects.toThrow(
        new NotFoundException("Instructor with ID ghost not found for Dojo"),
      );
    });

    it("should move image from temp folder if imagePublicId is provided", async () => {
      const imagePublicId = "temp-img-id";
      const dto = buildCreateClassDTOMock({ imagePublicId });
      await ClassService.createClass({ dto, dojo });
      expect(moveImageSpy).toHaveBeenCalledWith(imagePublicId, dojo.id, ImageType.CLASS);
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
          schedulesData: [expect.objectContaining({ initialClassDate: scheduleDate })],
        }),
        dbServiceSpy.mockTx,
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
          schedulesData: [expect.objectContaining({ initialClassDate: expectedDate })],
        }),
        dbServiceSpy.mockTx,
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

        expect(createStripeProdSpy).toHaveBeenCalledWith({
          className: dto.name,
          dojoId: dojo.id,
          classId: newClassId,
        });
        expect(createStripePriceSpy).toHaveBeenCalledWith("prod_123", dto.price, ClassFrequency.Weekly);
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
          new BadRequestException("Price is required for paid classes"),
        );
      });
    });

    describe("for a paid one-time class", () => {
      it("should create stripe product and price, and update the class", async () => {
        const dto = buildCreateClassDTOMock({
          frequency: ClassFrequency.OneTime,
          subscriptionType: ClassSubscriptionType.Paid,
          price: 30,
        });

        await ClassService.createClass({ dto, dojo });

        expect(createStripeProdSpy).toHaveBeenCalledWith({
          className: dto.name,
          dojoId: dojo.id,
          classId: newClassId,
        });
        expect(createStripePriceSpy).toHaveBeenCalledWith(
          "prod_123",
          dto.price,
          ClassFrequency.OneTime,
        );
        expect(updateClassRepoSpy).toHaveBeenCalledWith({
          classId: newClassId,
          update: { stripePriceId: "price_123" },
          tx: dbServiceSpy.mockTx,
        });
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
        new InternalServerErrorException("Dojo owner not found"),
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
        new InternalServerErrorException("Dojo Instructor not found"),
      );
    });
  });

  describe("updateClass", () => {
    const classId = "class-to-update";

    it("should throw NotFoundException if class does not exist", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);
      const dto: UpdateClassDTO = { name: "New Name" };

      await expect(ClassService.updateClass({ classId, dto })).rejects.toThrow(NotFoundException);
    });

    it("should update basic class details", async () => {
      const existingClass = buildClassMock({ id: classId, dojoId: dojo.id });
      findClassByIdRepoSpy.mockResolvedValue(existingClass);
      const dto: UpdateClassDTO = { name: "Updated Class Name", capacity: 30 };

      await ClassService.updateClass({ classId, dto });

      expect(updateClassRepoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          classId,
          update: expect.objectContaining({
            name: "Updated Class Name",
            capacity: 30,
          }),
        }),
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

      await ClassService.updateClass({ classId, dto });

      expect(deleteSchedulesRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
      expect(createSchedulesRepoSpy).toHaveBeenCalled();
    });
  });

  describe("schema validation", () => {
    it("should throw validation error if subscriptionType is provided", () => {
      const dto = {
        subscriptionType: "Paid",
      };
      const result = UpdateClassSchema.safeParse(dto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Subscription type cannot be updated.");
      }
    });

    it("should throw validation error if price is provided", () => {
      const dto = {
        price: 100,
      };
      const result = UpdateClassSchema.safeParse(dto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Price cannot be updated.");
      }
    });
  });

  describe("updateClassInstructor", () => {
    it("should call updateClass with the correct parameters", async () => {
      const classId = "class-123";
      const dojoId = dojo.id;
      const instructorId = "instructor-456";

      // Spy on the method we expect to be called
      const updateClassSpy = vi.spyOn(ClassService, "updateClass").mockResolvedValue({} as any); // Mock the return value

      await ClassService.updateClassInstructor({
        classId,
        instructorId,
      });

      expect(updateClassSpy).toHaveBeenCalledWith(
        {
          classId,
          dto: { instructorId },
        },
        undefined, // expecting txInstance to be undefined when not passed
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

      const result = await ClassService.getAllClassAndInstructorsByDojoId(dojo.id);

      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(dojo.id, dbServiceSpy.mockTx);
      expect(userProfileByInstructorIdsSpy).toHaveBeenCalledWith(
        [instructor.id, instructor2.id],
        dbServiceSpy.mockTx,
      );

      expect(result.length).toBe(3);
      expect(result[0].instructor).toBeDefined();
      expect(result[0].instructor?.firstName).toEqual(instructorProfile.firstName);
      expect(result[1].instructor).toBeDefined();
      expect(result[1].instructor?.firstName).toEqual(instructorProfile2.firstName);
      expect(result[2].instructor).toBeNull();
    });
  });

  describe("fetchClassAndSchedules", () => {
    const classId = "test-class-id";

    it("should return null if the class is not found", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);

      const result = await ClassService.fetchClassAndSchedules(classId);

      expect(result).toBeNull();
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
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
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
      expect(fetchClassSchedulesRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
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

      const result = ClassService.mapCreateClassScheduleDTOToINewClassSchedule(dto);

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

      const result = ClassService.mapCreateClassScheduleDTOToINewClassSchedule(dto);

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
      const result = ClassService.mapCreateClassScheduleDTOToINewClassSchedule([]);
      expect(result).toEqual([]);
    });
  });

  describe("assertValidClassImage", () => {
    it("should not throw an error for a valid image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: CloudinaryResourceType.IMAGE,
      } as any);

      await expect(ClassService.assertValidClassImage("valid-image-id")).resolves.not.toThrow();
    });

    it("should throw NotFoundException if asset is not found", async () => {
      fetchImageAssetSpy.mockResolvedValue(null);

      await expect(ClassService.assertValidClassImage("not-found-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if asset is not an image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: "video",
      } as any);

      await expect(ClassService.assertValidClassImage("video-id")).rejects.toThrow(
        BadRequestException,
      );
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
        dbServiceSpy.mockTx,
      );

      expect(result).toEqual(mockInstructor);
      expect(findInstructorSpy).toHaveBeenCalledWith(instructorId, dojoId, dbServiceSpy.mockTx);
    });

    it("should throw NotFoundException if instructor is not found in the dojo", async () => {
      findInstructorSpy.mockResolvedValue(null);

      await expect(
        ClassService.assertInstructorExistInDojo(instructorId, dojoId, dbServiceSpy.mockTx),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getClassInfo", () => {
    const classId = "test-class-id";

    beforeEach(() => {
      // Restore the original implementation of getClassInfo for this suite
      if (getClassSchedulesAndInstructorSpy) {
        getClassSchedulesAndInstructorSpy.mockRestore();
      }
    });

    it("should throw NotFoundException if class is not found", async () => {
      findClassByIdRepoSpy.mockResolvedValue(null);

      await expect(ClassService.getClassSchedulesAndInstructor(classId)).rejects.toThrow(
        new NotFoundException(`Class with ID ${classId} not found.`),
      );
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
    });

    it("should return class info without instructor details if class has no instructor", async () => {
      const mockClass = buildClassMock({ id: classId, instructorId: null });
      findClassByIdRepoSpy.mockResolvedValue(mockClass);
      fetchClassSchedulesRepoSpy.mockResolvedValue([]);

      const result = await ClassService.getClassSchedulesAndInstructor(classId);

      expect(result).toEqual({
        ...mockClass,
        schedules: [],
        instructor: null,
      });
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
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

      const result = await ClassService.getClassSchedulesAndInstructor(classId);

      expect(result).toEqual({
        ...mockClass,
        schedules: [],
        instructor: {
          ...mockInstructorProfile,
          instructorId: mockInstructorId,
        },
      });
      expect(findClassByIdRepoSpy).toHaveBeenCalledWith(classId, dbServiceSpy.mockTx);
      expect(userProfileForInstructorSpy).toHaveBeenCalledWith(
        mockInstructorId,
        dbServiceSpy.mockTx,
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

      await expect(ClassService.getClassSchedulesAndInstructor(classId)).rejects.toThrow(
        new InternalServerErrorException("Instructor User account not found"),
      );
    });
  });
  describe("getEnrolledStudents", () => {
    let fetchActiveEnrollmentsSpy: MockInstance;
    let fetchStudentsWithUsersByIdsSpy: MockInstance;

    beforeEach(() => {
      fetchActiveEnrollmentsSpy = vi.spyOn(
        ClassEnrollmentRepository,
        "fetchActiveEnrollmentsByClassId",
      );
      fetchStudentsWithUsersByIdsSpy = vi.spyOn(StudentRepository, "fetchStudentsWithUsersByIds");
    });

    it("should return empty array if no active enrollments found", async () => {
      fetchActiveEnrollmentsSpy.mockResolvedValue([]);

      const result = await ClassService.getEnrolledStudents("class-id");

      expect(result).toEqual([]);
      expect(fetchActiveEnrollmentsSpy).toHaveBeenCalledWith("class-id", dbServiceSpy.mockTx);
      expect(fetchStudentsWithUsersByIdsSpy).not.toHaveBeenCalled();
    });

    it("should return list of students when enrollments exist", async () => {
      const mockEnrollments = [
        { studentId: "student-1", active: true },
        { studentId: "student-2", active: true },
      ];
      fetchActiveEnrollmentsSpy.mockResolvedValue(mockEnrollments);

      const mockStudentRecords = [
        {
          student: {
            id: "student-1",
            studentUserId: "user-1",
            parentId: "parent-1",
            experienceLevel: "Beginner",
          },
          user: buildUserMock({ id: "user-1" }),
        },
        {
          student: {
            id: "student-2",
            studentUserId: "user-2",
            parentId: "parent-2",
            experienceLevel: "Intermediate",
          },
          user: buildUserMock({ id: "user-2" }),
        },
      ];
      fetchStudentsWithUsersByIdsSpy.mockResolvedValue(mockStudentRecords);

      const result = await ClassService.getEnrolledStudents("class-id");

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StudentWihUserDTO);
      expect(result[0].id).toBe("student-1");
      expect(result[1].id).toBe("student-2");

      expect(fetchActiveEnrollmentsSpy).toHaveBeenCalledWith("class-id", dbServiceSpy.mockTx);
      expect(fetchStudentsWithUsersByIdsSpy).toHaveBeenCalledWith(
        ["student-1", "student-2"],
        dbServiceSpy.mockTx,
      );
    });
  });

  describe("getDojoClasses", () => {
    let getDojoForOwnerSpy: MockInstance;
    let findAllByDojoIdSpy: MockInstance;

    beforeEach(() => {
      getDojoForOwnerSpy = vi.spyOn(DojoRepository, "getDojoForOwner");
      findAllByDojoIdSpy = vi.spyOn(ClassRepository, "findAllByDojoId");
    });

    it("should throw InternalServerErrorException if user is not a dojo admin", async () => {
      const nonAdminUser = buildUserMock({ role: Role.Instructor });

      await expect(ClassService.getDojoClasses(nonAdminUser)).rejects.toThrow(
        new InternalServerErrorException("User is not a dojo admin"),
      );
      expect(getDojoForOwnerSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if dojo not found for user", async () => {
      const adminUser = buildUserMock({ role: Role.DojoAdmin });
      getDojoForOwnerSpy.mockResolvedValue(null);

      await expect(ClassService.getDojoClasses(adminUser)).rejects.toThrow(
        new NotFoundException("Dojo not found for user"),
      );
    });

    it("should return classes for the dojo", async () => {
      const adminUser = buildUserMock({ role: Role.DojoAdmin });
      const mockDojo = buildDojoMock({ ownerUserId: adminUser.id });
      const mockClasses = [
        buildClassMock({ id: "class-1", dojoId: mockDojo.id }),
        buildClassMock({ id: "class-2", dojoId: mockDojo.id }),
      ];

      getDojoForOwnerSpy.mockResolvedValue(mockDojo);
      findAllByDojoIdSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getDojoClasses(adminUser);

      expect(result).toEqual(mockClasses);
      expect(getDojoForOwnerSpy).toHaveBeenCalledWith(adminUser.id, dbServiceSpy.mockTx);
      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(mockDojo.id, dbServiceSpy.mockTx);
    });
  });

  describe("getInstructorClasses", () => {
    let findOneByUserIdSpy: MockInstance;
    let findAllByInstructorIdSpy: MockInstance;

    beforeEach(() => {
      findOneByUserIdSpy = vi.spyOn(InstructorsRepository, "findOneByUserId");
      findAllByInstructorIdSpy = vi.spyOn(ClassRepository, "findAllByInstructorId");
    });

    it("should throw InternalServerErrorException if user is not an instructor", async () => {
      const nonInstructorUser = buildUserMock({ role: Role.Parent });

      await expect(ClassService.getInstructorClasses(nonInstructorUser)).rejects.toThrow(
        new InternalServerErrorException("User is not an instructor"),
      );
      expect(findOneByUserIdSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if instructor record not found", async () => {
      const instructorUser = buildUserMock({ role: Role.Instructor });
      findOneByUserIdSpy.mockResolvedValue(null);

      await expect(ClassService.getInstructorClasses(instructorUser)).rejects.toThrow(
        new NotFoundException("Instructor not found"),
      );
    });

    it("should return classes assigned to the instructor", async () => {
      const instructorUser = buildUserMock({ role: Role.Instructor });
      const mockInstructor = buildInstructorMock({ instructorUserId: instructorUser.id });
      const mockClasses = [
        buildClassMock({ id: "class-1", instructorId: mockInstructor.id }),
        buildClassMock({ id: "class-2", instructorId: mockInstructor.id }),
      ];

      findOneByUserIdSpy.mockResolvedValue(mockInstructor);
      findAllByInstructorIdSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getInstructorClasses(instructorUser);

      expect(result).toEqual(mockClasses);
      expect(findOneByUserIdSpy).toHaveBeenCalledWith(instructorUser.id, dbServiceSpy.mockTx);
      expect(findAllByInstructorIdSpy).toHaveBeenCalledWith(
        mockInstructor.id,
        dbServiceSpy.mockTx,
      );
    });
  });

  describe("getParentClasses", () => {
    let getOneParentByUserIdSpy: MockInstance;
    let getStudentsByParentIdSpy: MockInstance;
    let fetchActiveEnrollmentsByStudentIdsSpy: MockInstance;
    let findClassesByIdsSpy: MockInstance;

    beforeEach(() => {
      getOneParentByUserIdSpy = vi.spyOn(ParentRepository, "getOneParentByUserId");
      getStudentsByParentIdSpy = vi.spyOn(StudentRepository, "getStudentsByParentId");
      fetchActiveEnrollmentsByStudentIdsSpy = vi.spyOn(
        ClassEnrollmentRepository,
        "fetchActiveEnrollmentsByStudentIds",
      );
      findClassesByIdsSpy = vi.spyOn(ClassRepository, "findClassesByIds");
    });

    it("should throw InternalServerErrorException if user is not a parent", async () => {
      const nonParentUser = buildUserMock({ role: Role.Instructor });

      await expect(ClassService.getParentClasses(nonParentUser)).rejects.toThrow(
        new InternalServerErrorException("User is not a parent"),
      );
      expect(getOneParentByUserIdSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if parent record not found", async () => {
      const parentUser = buildUserMock({ role: Role.Parent });
      getOneParentByUserIdSpy.mockResolvedValue(null);

      await expect(ClassService.getParentClasses(parentUser)).rejects.toThrow(
        new NotFoundException("Parent not found"),
      );
    });

    it("should return empty array if parent has no students", async () => {
      const parentUser = buildUserMock({ role: Role.Parent });
      const mockParent = buildParentMock({ userId: parentUser.id });

      getOneParentByUserIdSpy.mockResolvedValue(mockParent);
      getStudentsByParentIdSpy.mockResolvedValue([]);

      const result = await ClassService.getParentClasses(parentUser);

      expect(result).toEqual([]);
      expect(fetchActiveEnrollmentsByStudentIdsSpy).not.toHaveBeenCalled();
    });

    it("should return empty array if no active enrollments", async () => {
      const parentUser = buildUserMock({ role: Role.Parent });
      const mockParent = buildParentMock({ userId: parentUser.id });
      const mockStudent = buildStudentMock({ parentId: mockParent.id });

      getOneParentByUserIdSpy.mockResolvedValue(mockParent);
      getStudentsByParentIdSpy.mockResolvedValue([{ student: mockStudent, user: buildUserMock() }]);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([]);

      const result = await ClassService.getParentClasses(parentUser);

      expect(result).toEqual([]);
      expect(findClassesByIdsSpy).not.toHaveBeenCalled();
    });

    it("should return classes where children are enrolled", async () => {
      const parentUser = buildUserMock({ role: Role.Parent });
      const mockParent = buildParentMock({ userId: parentUser.id });
      const mockStudent1 = buildStudentMock({ id: "student-1", parentId: mockParent.id });
      const mockStudent2 = buildStudentMock({ id: "student-2", parentId: mockParent.id });
      const mockClasses = [
        buildClassMock({ id: "class-1" }),
        buildClassMock({ id: "class-2" }),
      ];

      getOneParentByUserIdSpy.mockResolvedValue(mockParent);
      getStudentsByParentIdSpy.mockResolvedValue([
        { student: mockStudent1, user: buildUserMock() },
        { student: mockStudent2, user: buildUserMock() },
      ]);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([
        { studentId: "student-1", classId: "class-1" },
        { studentId: "student-2", classId: "class-2" },
        { studentId: "student-1", classId: "class-2" }, // duplicate class
      ]);
      findClassesByIdsSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getParentClasses(parentUser);

      expect(result).toEqual(mockClasses);
      expect(findClassesByIdsSpy).toHaveBeenCalledWith(["class-1", "class-2"], dbServiceSpy.mockTx);
    });
  });

  describe("getStudentClasses", () => {
    let findOneStudentByUserIdSpy: MockInstance;
    let fetchActiveEnrollmentsByStudentIdsSpy: MockInstance;
    let findClassesByIdsSpy: MockInstance;

    beforeEach(() => {
      findOneStudentByUserIdSpy = vi.spyOn(StudentRepository, "findOneByUserId");
      fetchActiveEnrollmentsByStudentIdsSpy = vi.spyOn(
        ClassEnrollmentRepository,
        "fetchActiveEnrollmentsByStudentIds",
      );
      findClassesByIdsSpy = vi.spyOn(ClassRepository, "findClassesByIds");
    });

    it("should throw InternalServerErrorException if user is not a child", async () => {
      const nonChildUser = buildUserMock({ role: Role.Parent });

      await expect(ClassService.getStudentClasses(nonChildUser)).rejects.toThrow(
        new InternalServerErrorException("User is not a child"),
      );
      expect(findOneStudentByUserIdSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if student record not found", async () => {
      const childUser = buildUserMock({ role: Role.Child });
      findOneStudentByUserIdSpy.mockResolvedValue(null);

      await expect(ClassService.getStudentClasses(childUser)).rejects.toThrow(
        new NotFoundException("Student not found"),
      );
    });

    it("should return empty array if no active enrollments", async () => {
      const childUser = buildUserMock({ role: Role.Child });
      const mockStudent = buildStudentMock({ studentUserId: childUser.id });

      findOneStudentByUserIdSpy.mockResolvedValue(mockStudent);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([]);

      const result = await ClassService.getStudentClasses(childUser);

      expect(result).toEqual([]);
      expect(findClassesByIdsSpy).not.toHaveBeenCalled();
    });

    it("should return classes student is enrolled in", async () => {
      const childUser = buildUserMock({ role: Role.Child });
      const mockStudent = buildStudentMock({ id: "student-1", studentUserId: childUser.id });
      const mockClasses = [
        buildClassMock({ id: "class-1" }),
        buildClassMock({ id: "class-2" }),
      ];

      findOneStudentByUserIdSpy.mockResolvedValue(mockStudent);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([
        { studentId: "student-1", classId: "class-1" },
        { studentId: "student-1", classId: "class-2" },
      ]);
      findClassesByIdsSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getStudentClasses(childUser);

      expect(result).toEqual(mockClasses);
      expect(fetchActiveEnrollmentsByStudentIdsSpy).toHaveBeenCalledWith(
        ["student-1"],
        dbServiceSpy.mockTx,
      );
      expect(findClassesByIdsSpy).toHaveBeenCalledWith(["class-1", "class-2"], dbServiceSpy.mockTx);
    });
  });

  describe("getUserClasses", () => {
    let getDojoClassesSpy: MockInstance;
    let getInstructorClassesSpy: MockInstance;
    let getParentClassesSpy: MockInstance;
    let getStudentClassesSpy: MockInstance;

    beforeEach(() => {
      getDojoClassesSpy = vi.spyOn(ClassService, "getDojoClasses");
      getInstructorClassesSpy = vi.spyOn(ClassService, "getInstructorClasses");
      getParentClassesSpy = vi.spyOn(ClassService, "getParentClasses");
      getStudentClassesSpy = vi.spyOn(ClassService, "getStudentClasses");
    });

    it("should throw NotFoundException if user not found", async () => {
      getUserByIdSpy.mockResolvedValue(null);

      await expect(ClassService.getUserClasses("unknown-user-id")).rejects.toThrow(
        new NotFoundException("User not Found"),
      );
    });

    it("should call getDojoClasses for DojoAdmin users", async () => {
      const adminUser = buildUserMock({ role: Role.DojoAdmin });
      const mockClasses = [buildClassMock()];

      getUserByIdSpy.mockResolvedValue(adminUser);
      getDojoClassesSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getUserClasses(adminUser.id);

      expect(result).toEqual(mockClasses);
      expect(getDojoClassesSpy).toHaveBeenCalledWith(adminUser, dbServiceSpy.mockTx);
      expect(getInstructorClassesSpy).not.toHaveBeenCalled();
    });

    it("should call getInstructorClasses for Instructor users", async () => {
      const instructorUser = buildUserMock({ role: Role.Instructor });
      const mockClasses = [buildClassMock()];

      getUserByIdSpy.mockResolvedValue(instructorUser);
      getInstructorClassesSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getUserClasses(instructorUser.id);

      expect(result).toEqual(mockClasses);
      expect(getInstructorClassesSpy).toHaveBeenCalledWith(instructorUser, dbServiceSpy.mockTx);
      expect(getDojoClassesSpy).not.toHaveBeenCalled();
    });

    it("should call getParentClasses for Parent users", async () => {
      const parentUser = buildUserMock({ role: Role.Parent });
      const mockClasses = [buildClassMock()];

      getUserByIdSpy.mockResolvedValue(parentUser);
      getParentClassesSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getUserClasses(parentUser.id);

      expect(result).toEqual(mockClasses);
      expect(getParentClassesSpy).toHaveBeenCalledWith(parentUser, dbServiceSpy.mockTx);
    });

    it("should call getStudentClasses for Child users", async () => {
      const childUser = buildUserMock({ role: Role.Child });
      const mockClasses = [buildClassMock()];

      getUserByIdSpy.mockResolvedValue(childUser);
      getStudentClassesSpy.mockResolvedValue(mockClasses);

      const result = await ClassService.getUserClasses(childUser.id);

      expect(result).toEqual(mockClasses);
      expect(getStudentClassesSpy).toHaveBeenCalledWith(childUser, dbServiceSpy.mockTx);
    });

    it("should return empty array for unknown role", async () => {
      const unknownRoleUser = buildUserMock({ role: "Unknown" as Role });

      getUserByIdSpy.mockResolvedValue(unknownRoleUser);

      const result = await ClassService.getUserClasses(unknownRoleUser.id);

      expect(result).toEqual([]);
    });
  });
});

