import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import {
  ClassRepository,
  IClass,
  IClassSchedule,
  INewClass,
} from "../repositories/class.repository.js";
import { CreateClassDTO } from "../validations/classes.schemas.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { nextDay } from "date-fns";
import { ClassFrequency } from "../constants/enums.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";

export class ClassService {
  static createClass = async (
    {
      dto,
      dojoId,
    }: {
      dto: CreateClassDTO;
      dojoId: string;
    },
    txInstance?: dbService.Transaction
  ): Promise<ClassDTO> => {
    const execute = async (tx: Transaction) => {
      const { schedules, ...classDetails } = dto;

      const classData: INewClass = {
        ...classDetails,
        dojoId,
        price: classDetails.price ? classDetails.price.toString() : null,
      };

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
}
