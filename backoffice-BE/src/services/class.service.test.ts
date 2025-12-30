import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import type { Mock, MockInstance } from "vitest";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { ClassService } from "./class.service.js";
import {
  buildClassMock,
  buildCreateClassDTOMock,
} from "../tests/factories/class.factory.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import {
  ClassFrequency,
  ClassLevel,
  ClassSubscriptionType,
  Weekday,
} from "../constants/enums.js";
import { CreateClassDTO } from "../validations/classes.schemas.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { nextDay } from "date-fns";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";

vi.mock("date-fns");
vi.mock("../utils/date.utils.js");

describe("Class Service", () => {
  const mockedNextDay = vi.mocked(nextDay);
  let dbServiceSpy : DbServiceSpies

  beforeEach(() => {
    dbServiceSpy = createDrizzleDbSpies();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("createClass", () => {
    let createClassSpy: MockInstance;
    let findByIdSpy: MockInstance;
    const dojoId = "dojo-1";

    const mockedDojo = buildDojoMock({ id: dojoId })

    beforeEach(() => {
      const mockClass = buildClassMock();
      createClassSpy = vi
        .spyOn(ClassRepository, "create")
        .mockResolvedValue("new-class-id");
      findByIdSpy = vi
        .spyOn(ClassRepository, "findById")
        .mockResolvedValue(mockClass);
    });

    describe("for a weekly class", () => {
      const dto: CreateClassDTO = buildCreateClassDTOMock({
        name: "New Weekly Class",
        level: ClassLevel.Beginner,
        minAge: 5,
        maxAge: 10,
        capacity: 15,
        streetAddress: "123 Dojo St",
        city: "Dojoville",
        frequency: ClassFrequency.Weekly,
        subscriptionType: ClassSubscriptionType.Free,
        schedules: [
          {
            type: ClassFrequency.Weekly,
            weekday: Weekday.Monday,
            startTime: "16:00",
            endTime: "17:00",
          },
        ],
      });

      it("should successfully create a weekly class", async () => {
        const fakeDate = new Date();
        mockedNextDay.mockReturnValue(fakeDate);

        const result = await ClassService.createClass({ dto, dojo: mockedDojo });

        const { schedules, ...classDetails } = dto;
        const { type, ...scheduleData } = schedules[0];

        expect(createClassSpy).toHaveBeenCalledWith(
          {
            classData: {
              ...classDetails,
              dojoId,
              price: null,
            },
            schedulesData: [
              {
                ...scheduleData,
                initialClassDate: fakeDate,
              },
            ],
          },
          dbServiceSpy.mockTx
        );
        expect(findByIdSpy).toHaveBeenCalledWith(
          "new-class-id",
          expect.anything()
        );
        expect(result).toBeInstanceOf(ClassDTO);
        expect(mockedNextDay).toHaveBeenCalled();
      });
    });

    describe("for a one-time class", () => {
      const scheduleDate = new Date();
      const dto: CreateClassDTO = buildCreateClassDTOMock({
        name: "New One-Time Class",
        level: ClassLevel.Advanced,
        minAge: 10,
        maxAge: 18,
        capacity: 20,
        streetAddress: "456 Seminar Ave",
        city: "Eventown",
        frequency: ClassFrequency.OneTime,
        subscriptionType: ClassSubscriptionType.Paid,
        price: 25,
        schedules: [
          {
            type: ClassFrequency.OneTime,
            date: scheduleDate,
            startTime: "10:00",
            endTime: "12:00",
          },
        ],
      });

      it("should successfully create a one-time class", async () => {
        const result = await ClassService.createClass({ dto, dojo: mockedDojo });

        const { schedules, ...classDetails } = dto;
        const { type, ...scheduleData } = schedules[0];

        expect(createClassSpy).toHaveBeenCalledWith(
          {
            classData: {
              ...classDetails,
              price: "25",
              dojoId,
            },
            schedulesData: [
              {
                ...scheduleData,
                initialClassDate: scheduleDate,
              },
            ],
          },
          expect.anything()
        );
        expect(findByIdSpy).toHaveBeenCalledWith(
          "new-class-id",
          expect.anything()
        );
        expect(result).toBeInstanceOf(ClassDTO);
        expect(mockedNextDay).not.toHaveBeenCalled();
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
      expect(findByIdSpy).toHaveBeenCalledWith("class-1", expect.anything());
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
        expect.anything()
      );
    });

    it("should return an empty array if no classes are found", async () => {
      const dojoId = "dojo-1";
      findAllByDojoIdSpy.mockResolvedValue([]);

      const result = await ClassService.getAllClassesByDojoId(dojoId);

      expect(result).toEqual([]);
      expect(findAllByDojoIdSpy).toHaveBeenCalledWith(
        dojoId,
        expect.anything()
      );
    });
  });
});