import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import {
  ClassRepository,
  ClassWithInstructor,
  ClassWithSchedulesAndInstructor,
  IClass,
  IClassSchedule,
  INewClass,
  INewClassSchedule,
  IUpdateClass,
} from "../repositories/class.repository.js";
import {
  CreateClassDTO,
  CreateClassScheduleDTO,
  UpdateClassDTO,
} from "../validations/classes.schemas.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { nextDay } from "date-fns";
import { ClassFrequency, ClassSubscriptionType } from "../constants/enums.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";
import {
  IDojoInstructor,
  InstructorsRepository,
} from "../repositories/instructors.repository.js";
import { StripeService } from "./stripe.service.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { CloudinaryResourceType, ImageType } from "../constants/cloudinary.js";
import { ForbiddenException } from "../core/errors/ForbiddenException.js";
import {
  InstructorUserDetails,
  UserRepository,
} from "../repositories/user.repository.js";

export class ClassService {
  static createClass = async (
    {
      dto,
      dojo,
    }: {
      dto: CreateClassDTO;
      dojo: IDojo;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    const execute = async (tx: Transaction) => {
      const { schedules, ...classDetails } = dto;
      let dojoInstructor: IDojoInstructor | null = null;

      if (dto.imagePublicId) {
        await ClassService.assertValidClassImage(dto.imagePublicId);
      }

      if (dto.instructorId) {
        dojoInstructor = await ClassService.assertInstructorExistInDojo(
          dto.instructorId,
          dojo.id,
          tx
        );
      }

      const classData: INewClass = {
        ...classDetails,
        dojoId: dojo.id,
        price: classDetails.price ? classDetails.price.toString() : null,
      };

      if (dto.imagePublicId) {
        await CloudinaryService.moveImageFromTempFolder(
          dto.imagePublicId,
          dojo.id,
          ImageType.CLASS
        );
      }

      const newClassId = await ClassRepository.create(
        {
          classData,
          schedulesData:
            ClassService.mapCreateClassScheduleDTOToINewClassSchedule(
              schedules
            ),
        },
        tx
      );

      const classWithSchedules = await ClassService.fetchClassAndSchedules(
        newClassId,
        tx
      );

      if (
        classData.frequency === ClassFrequency.Weekly &&
        classData.subscriptionType === ClassSubscriptionType.Paid
      ) {
        if (!classData.price) {
          throw new BadRequestException("Price is required for paid classes");
        }

        const stripeProd = await StripeService.createClassProduct(
          {
            className: classData.name,
            dojoId: dojo.id,
            classId: newClassId,
          }
        );
        const prodPrice = await StripeService.createClassPrice(
          stripeProd.id,
          Number(classData.price)
        );

        await ClassRepository.update({
          classId: newClassId,
          update: {
            stripePriceId: prodPrice.id,
          },
          tx,
        });
      }

      // TODO: Set Up Chat

      // TODO: Set up Grading Notification

      const dojoOwner = await UsersService.getOneUserByID({
        userId: dojo.ownerUserId,
        txInstance: tx,
      });

      if (!dojoOwner) {
        throw new InternalServerErrorException("Dojo owner not found");
      }

      await NotificationService.notifyDojoOwnerOfClassCreation({
        className: classData.name,
        dojoOwner: dojoOwner,
      });

      if (dto.instructorId && dojoInstructor) {
        const instructorUserProfile = await UsersService.getOneUserByID({
          userId: dojoInstructor.instructorUserId,
          txInstance: tx,
        });

        if (!instructorUserProfile) {
          throw new InternalServerErrorException("Dojo Instructor not found");
        }

        await NotificationService.notifyInstructorOfNewClassAssigned({
          className: classData.name,
          instructor: instructorUserProfile,
        });
      }

      return new ClassDTO(await ClassService.getClassSchedulesAndInstructor(newClassId, tx));
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getClassSchedulesAndInstructor = async (
    classId: string,
    txInstance?: Transaction
  ): Promise<ClassWithSchedulesAndInstructor> => {
    const execute = async (tx: Transaction) => {
      const classAndSchedules = await ClassService.fetchClassAndSchedules(
        classId,
        tx
      );
      if (!classAndSchedules) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      let instructorDetails: InstructorUserDetails | null = null;

      if (classAndSchedules.instructorId) {
        const instructorUserProfile =
          await UserRepository.getUserProfileForInstructor(
            classAndSchedules.instructorId,
            tx
          );

        if (!instructorUserProfile) {
          throw new InternalServerErrorException(
            `Instructor User account not found`
          );
        }

        instructorDetails = {
          ...instructorUserProfile,
          instructorId: classAndSchedules.instructorId,
        };
      }

      return {
        ...classAndSchedules,
        instructor: instructorDetails,
      };
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getClassById = async (
    classId: string,
    txInstance?: Transaction
  ): Promise<IClass> => {
    const execute = async (tx: Transaction) => {
      const dojoClass = await ClassRepository.findById(classId, tx);

      if (!dojoClass) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      return dojoClass;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getAllClassesByDojoId = async (
    dojoId: string,
    txInstance?: Transaction
  ): Promise<ClassWithInstructor[]> => {
    const execute = async (tx: Transaction) => {
      const classes = await ClassRepository.findAllByDojoId(dojoId, tx);

      const instructorIds = classes
        .map((c) => c.instructorId)
        .filter((id): id is string => id !== null);

      const instructorUserDetails =
        await UserRepository.getUserProfileByInstructorIds(instructorIds, tx);

      const instructorMap = new Map<string, InstructorUserDetails>();
      instructorUserDetails.forEach((userDetails) => {
        instructorMap.set(userDetails.instructorId, userDetails);
      });

      return classes.map((c) => {
        let instructorUserDetails: InstructorUserDetails | null = null;

        if (c.instructorId) {
          instructorUserDetails = instructorMap.get(c.instructorId!) || null;
        }

        return {
          ...c,
          instructor: instructorUserDetails,
        };
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static async fetchClassAndSchedules(
    classId: string,
    txInstance?: Transaction
  ): Promise<(IClass & { schedules: IClassSchedule[] }) | null> {
    const execute = async (tx: Transaction) => {
      const dojoClass = await ClassRepository.findById(classId, tx);

      if (!dojoClass) {
        return null;
      }

      const schedules = await ClassRepository.fetchClassSchedules(classId, tx);

      return {
        ...dojoClass,
        schedules,
      };
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  }

  static updateClass = async (
    {
      classId,
      dto,
    }: {
      classId: string;
      dto: UpdateClassDTO;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    const execute = async (tx: dbService.Transaction) => {
      const existingClass = await ClassRepository.findById(classId, tx);

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      const { schedules, ...classDetails } = dto;
      const updatePayload: IUpdateClass = {
        ...classDetails,
      };

      if (dto.instructorId) {
        await ClassService.assertInstructorExistInDojo(
          dto.instructorId,
          existingClass.dojoId,
          tx
        );
        updatePayload.instructorId = dto.instructorId;
      }

      if (dto.imagePublicId) {
        await ClassService.assertValidClassImage(dto.imagePublicId);
      }

      // Handle schedule updates
      if (schedules && schedules.length > 0) {
        await ClassRepository.deleteSchedules(classId, tx);

        const schedulesToInsert: INewClassSchedule[] =
          ClassService.mapCreateClassScheduleDTOToINewClassSchedule(schedules);

        await ClassRepository.createSchedules(
          schedulesToInsert,
          existingClass.id,
          tx
        );
      }

      if (Object.keys(updatePayload).length > 0) {
        await ClassRepository.update({ classId, update: updatePayload, tx });
      }

      if (
        dto.imagePublicId &&
        dto.imagePublicId !== existingClass.imagePublicId
      ) {
        await CloudinaryService.moveImageFromTempFolder(
          dto.imagePublicId,
          existingClass.dojoId,
          ImageType.CLASS
        );
      }

      if (dto.instructorId && existingClass.instructorId != dto.instructorId) {
        if (existingClass.instructorId) {
          // Notify prev instructor of reassignment if there was one
          const prevInstructorUserProfile =
            await UserRepository.getUserProfileForInstructor(
              existingClass.instructorId,
              tx
            );

          if (!prevInstructorUserProfile) {
            throw new InternalServerErrorException("Dojo Instructor not found");
          }

          await NotificationService.notifyInstructorOfClassReassignment({
            className: existingClass.name,
            instructor: prevInstructorUserProfile,
          });
        }

        // Notify new instructor of class assignment
        const newInstructorUserProfile =
          await UserRepository.getUserProfileForInstructor(
            dto.instructorId,
            tx
          );

        if (!newInstructorUserProfile) {
          throw new InternalServerErrorException("Dojo Instructor not found");
        }

        await NotificationService.notifyInstructorOfNewClassAssigned({
          className: dto.name || existingClass.name,
          instructor: newInstructorUserProfile,
        });
      }

      const updatedClass = await ClassService.getClassSchedulesAndInstructor(classId, tx);
      return new ClassDTO(updatedClass!);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static updateClassInstructor = async (
    {
      classId,
      instructorId,
    }: {
      classId: string;
      instructorId: string | null;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    return await ClassService.updateClass(
      {
        classId,
        dto: { instructorId },
      },
      txInstance
    );
  };

  static mapCreateClassScheduleDTOToINewClassSchedule = (
    schedules: CreateClassScheduleDTO
  ): INewClassSchedule[] => {
    return schedules
      .map((s) => {
        let initialClassDate: Date;

        if (s.type === ClassFrequency.OneTime) {
          initialClassDate = s.date;
        } else {
          initialClassDate = nextDay(
            new Date(),
            mapWeekdayToDayNumber(s.weekday)
          );
        }

        const { type, ...scheduleData } = s;

        return {
          ...scheduleData,
          initialClassDate,
        };
      })
      .filter((s): s is INewClassSchedule => s !== null);
  };

  static assertValidClassImage = async (imagePublicId: string) => {
    const asset = await CloudinaryService.fetchImageAsset(imagePublicId);

    if (!asset) {
      throw new NotFoundException(`Image with ID ${imagePublicId} not found`);
    }

    if (asset.resource_type !== CloudinaryResourceType.IMAGE) {
      throw new BadRequestException(
        `Asset with ID ${imagePublicId} is not an image`
      );
    }
  };

  static assertInstructorExistInDojo = async (
    instructorId: string,
    dojoId: string,
    tx: Transaction
  ) => {
    const dojoInstructor = await InstructorsRepository.findOneByIdAndDojoId(
      instructorId,
      dojoId,
      tx
    );

    if (!dojoInstructor) {
      throw new NotFoundException(
        `Instructor with ID ${instructorId} not found for Dojo`
      );
    }

    return dojoInstructor;
  };
}
