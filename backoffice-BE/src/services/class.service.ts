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
  InstructorDetails,
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
          classData.name,
          dojo.id
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

      return new ClassDTO(await ClassService.getClassInfo(newClassId, tx));
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getClassInfo = async (
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

      let instructorDetails: InstructorDetails | null = null;

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
          id: classAndSchedules.instructorId,
          firstName: instructorUserProfile.firstName,
          lastName: instructorUserProfile.lastName,
          avatar: instructorUserProfile.avatar,
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
        let instructorUserDetails: InstructorDetails | null = null;

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
      dojoId,
      dto,
    }: {
      classId: string;
      dojoId: string;
      dto: UpdateClassDTO;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    const execute = async (tx: dbService.Transaction) => {
      const existingClass = await ClassRepository.findById(classId, tx);

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      if (existingClass.dojoId !== dojoId) {
        throw new ForbiddenException("Class does not belong to this dojo.");
      }

      const { schedules, ...classDetails } = dto;
      const updatePayload: IUpdateClass = {
        ...classDetails,
        price: classDetails.price?.toString() || null,
      };

      if (dto.instructorId) {
        await ClassService.assertInstructorExistInDojo(
          dto.instructorId,
          dojoId,
          tx
        );
        updatePayload.instructorId = dto.instructorId;
      }

      if (dto.imagePublicId) {
        await ClassService.assertValidClassImage(dto.imagePublicId);
      }

      if (dto.price) {
        updatePayload.price = dto.price.toString();
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

      if (
        dto.subscriptionType &&
        dto.subscriptionType !== existingClass.subscriptionType
      ) {
        if (dto.subscriptionType === ClassSubscriptionType.Paid) {
          // Becoming a paid class
          const price = dto.price || Number(existingClass.price);
          if (!price || price <= 0) {
            throw new BadRequestException(
              "Price must be greater than 0 for paid classes."
            );
          }

          const stripeProd = await StripeService.createClassProduct(
            existingClass.name,
            dojoId
          );
          const prodPrice = await StripeService.createClassPrice(
            stripeProd.id,
            price
          );
          updatePayload.stripePriceId = prodPrice.id;
        } else {
          // Becoming a free class
          if (existingClass.stripePriceId) {
            await StripeService.archivePrice(existingClass.stripePriceId);
          }
          updatePayload.stripePriceId = null;
          updatePayload.price = "0";
        }
      } else if (
        dto.price &&
        existingClass.subscriptionType === ClassSubscriptionType.Paid
      ) {
        // Price changed for a paid class
        let stripeProdId: string | null = null;

        if (!existingClass.stripePriceId) {
          // This is an error state, There should not be a paid class with no stripe price id
          console.error(`[Error State]: Paid class with no stripe price id`);

          const stripeProd = await StripeService.createClassProduct(
            existingClass.name,
            dojoId
          );

          stripeProdId = stripeProd.id;
        } else {
          const stripePrice = await StripeService.retrievePrice(
            existingClass.stripePriceId
          );
          const stripeProd = stripePrice?.product;

          if (!stripeProd) {
            throw new InternalServerErrorException("Stripe product not found");
          }

          stripeProdId =
            typeof stripeProd === "string" ? stripeProd : stripeProd.id;

          await StripeService.archivePrice(existingClass.stripePriceId);
        }

        const newPrice = await StripeService.createClassPrice(
          stripeProdId,
          dto.price
        );
        updatePayload.stripePriceId = newPrice.id;
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

      const updatedClass = await ClassService.getClassInfo(classId, tx);
      return new ClassDTO(updatedClass!);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static updateClassInstructor = async (
    {
      classId,
      dojoId,
      instructorId,
    }: {
      classId: string;
      dojoId: string;
      instructorId: string | null;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    return await ClassService.updateClass(
      {
        classId,
        dojoId,
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
