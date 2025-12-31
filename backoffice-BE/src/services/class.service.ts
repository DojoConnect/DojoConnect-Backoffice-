import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import {
  ClassRepository,
  IClass,
  IClassSchedule,
  INewClass,
  IUpdateClass,
} from "../repositories/class.repository.js";
import { CreateClassDTO } from "../validations/classes.schemas.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { nextDay } from "date-fns";
import { ClassFrequency, ClassSubscriptionType } from "../constants/enums.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { StripeService } from "./stripe.service.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { CloudinaryResourceType, ImageType } from "../constants/cloudinary.js";

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

      if (dto.imagePublicId) {
        const asset = await CloudinaryService.fetchImageAsset(
          dto.imagePublicId
        );

        if (!asset) {
          throw new NotFoundException(
            `Image with ID ${dto.imagePublicId} not found`
          );
        }

        if (asset.resource_type !== CloudinaryResourceType.IMAGE) {
          throw new BadRequestException(
            `Asset with ID ${dto.imagePublicId} is not an image`
          );
        }
      }

      if (dto.instructorId) {
        const instructor = await InstructorsRepository.findOneByIdAndDojoId(
          dto.instructorId,
          dojo.id,
          tx
        );

        if (!instructor) {
          throw new NotFoundException(
            `Instructor with ID ${dto.instructorId} not found for Dojo`
          );
        }
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
          schedulesData: schedules.map((s) => {
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
          }),
        },
        tx
      );

      const classWithSchedules = await ClassRepository.findById(newClassId, tx);

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

        await ClassService.updateClass({
          classId: newClassId,
          update: {
            stripePriceId: prodPrice.id,
          },
          txInstance: tx,
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

      return new ClassDTO(classWithSchedules!);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneClassById = async (
    classId: string,
    txInstance?: Transaction
  ): Promise<IClass & { schedules: IClassSchedule[] }> => {
    const execute = async (tx: Transaction) => {
      const classData = await ClassRepository.findById(classId, tx);
      if (!classData) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }
      return classData;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getAllClassesByDojoId = async (
    dojoId: string,
    txInstance?: Transaction
  ): Promise<IClass[]> => {
    const execute = async (tx: Transaction) => {
      return await ClassRepository.findAllByDojoId(dojoId, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static updateClass = async ({
    classId,
    update,
    txInstance,
  }: {
    classId: string;
    update: IUpdateClass;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      await ClassRepository.update({ classId, update, tx });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
