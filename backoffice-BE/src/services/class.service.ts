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
import { StudentWihUserDTO } from "../dtos/student.dtos.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { nextDay } from "date-fns";
import { ClassFrequency, ClassSubscriptionType, Role } from "../constants/enums.js";
import { mapWeekdayToDayNumber } from "../utils/date.utils.js";
import { IDojoInstructor, InstructorsRepository } from "../repositories/instructors.repository.js";
import { StripeService } from "./stripe.service.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { DojoRepository, IDojo } from "../repositories/dojo.repository.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { CloudinaryResourceType, ImageType } from "../constants/cloudinary.js";
import { InstructorUserDetails, IUser, UserRepository } from "../repositories/user.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { ChatsService } from "./chats.service.js";

export class ClassService {
  static createClass = async (
    {
      dto,
      dojo,
    }: {
      dto: CreateClassDTO;
      dojo: IDojo;
    },
    txInstance?: dbService.Transaction,
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
          tx,
        );
      }

      if (dto.imagePublicId) {
        await CloudinaryService.moveImageFromTempFolder(
          dto.imagePublicId,
          dojo.id,
          ImageType.CLASS,
        );
      }

      const dojoOwner = await UsersService.getOneUserByID({
        userId: dojo.ownerUserId,
        txInstance: tx,
      });

      if (!dojoOwner) {
        throw new InternalServerErrorException("Dojo owner not found");
      }

      const chatId = await ChatsService.createClassGroupChat(dojoOwner, tx);

      const classData: INewClass = {
        ...classDetails,
        dojoId: dojo.id,
        price: classDetails.price ? classDetails.price.toString() : null,
        chatId
      };

      const newClassId = await ClassRepository.create(
        {
          classData,
          schedulesData: ClassService.mapCreateClassScheduleDTOToINewClassSchedule(schedules),
        },
        tx,
      );

      const classWithSchedules = await ClassService.fetchClassAndSchedules(newClassId, tx);

      if (
        classData.frequency === ClassFrequency.Weekly &&
        classData.subscriptionType === ClassSubscriptionType.Paid
      ) {
        if (!classData.price) {
          throw new BadRequestException("Price is required for paid classes");
        }

        const stripeProd = await StripeService.createClassProduct({
          className: classData.name,
          dojoId: dojo.id,
          classId: newClassId,
        });
        const prodPrice = await StripeService.createClassPrice(
          stripeProd.id,
          Number(classData.price),
        );

        await ClassRepository.update({
          classId: newClassId,
          update: {
            stripePriceId: prodPrice.id,
          },
          tx,
        });
      }
      
      // TODO: Set up Grading Notification
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

        await ChatsService.addInstructorToChat({
          chatId,
          dojoOwner,
          instructor: instructorUserProfile,
        }, tx);

        await NotificationService.notifyInstructorOfNewClassAssigned({
          className: classData.name,
          instructor: instructorUserProfile,
        });
      }

      return new ClassDTO(await ClassService.getClassSchedulesAndInstructor(newClassId, tx));
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getClassSchedulesAndInstructor = async (
    classId: string,
    txInstance?: Transaction,
  ): Promise<ClassWithSchedulesAndInstructor> => {
    const execute = async (tx: Transaction) => {
      const classAndSchedules = await ClassService.fetchClassAndSchedules(classId, tx);
      if (!classAndSchedules) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      let instructorDetails: InstructorUserDetails | null = null;

      if (classAndSchedules.instructorId) {
        const instructorUserProfile = await UserRepository.getUserProfileForInstructor(
          classAndSchedules.instructorId,
          tx,
        );

        if (!instructorUserProfile) {
          throw new InternalServerErrorException(`Instructor User account not found`);
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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getClassById = async (classId: string, txInstance?: Transaction): Promise<IClass> => {
    const execute = async (tx: Transaction) => {
      const dojoClass = await ClassRepository.findById(classId, tx);

      if (!dojoClass) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
      }

      return dojoClass;
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getAllClassAndInstructorsByDojoId = async (
    dojoId: string,
    txInstance?: Transaction,
  ): Promise<ClassWithInstructor[]> => {
    const execute = async (tx: Transaction) => {
      const classes = await ClassRepository.findAllByDojoId(dojoId, tx);

      const instructorIds = classes
        .map((c) => c.instructorId)
        .filter((id): id is string => id !== null);

      const instructorUserDetails = await UserRepository.getUserProfileByInstructorIds(
        instructorIds,
        tx,
      );

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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static async fetchClassAndSchedules(
    classId: string,
    txInstance?: Transaction,
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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  }

  static updateClass = async (
    {
      classId,
      dto,
    }: {
      classId: string;
      dto: UpdateClassDTO;
    },
    txInstance?: dbService.Transaction,
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
        await ClassService.assertInstructorExistInDojo(dto.instructorId, existingClass.dojoId, tx);
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

        await ClassRepository.createSchedules(schedulesToInsert, existingClass.id, tx);
      }

      if (Object.keys(updatePayload).length > 0) {
        await ClassRepository.update({ classId, update: updatePayload, tx });
      }

      if (dto.imagePublicId && dto.imagePublicId !== existingClass.imagePublicId) {
        await CloudinaryService.moveImageFromTempFolder(
          dto.imagePublicId,
          existingClass.dojoId,
          ImageType.CLASS,
        );
      }

      if (dto.instructorId && existingClass.instructorId != dto.instructorId) {
        if (existingClass.instructorId) {
          // Notify prev instructor of reassignment if there was one
          const prevInstructorUserProfile = await UserRepository.getUserProfileForInstructor(
            existingClass.instructorId,
            tx,
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
        const newInstructorUserProfile = await UserRepository.getUserProfileForInstructor(
          dto.instructorId,
          tx,
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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static updateClassInstructor = async (
    {
      classId,
      instructorId,
    }: {
      classId: string;
      instructorId: string | null;
    },
    txInstance?: dbService.Transaction,
  ): Promise<ClassDTO> => {
    return await ClassService.updateClass(
      {
        classId,
        dto: { instructorId },
      },
      txInstance,
    );
  };

  static mapCreateClassScheduleDTOToINewClassSchedule = (
    schedules: CreateClassScheduleDTO,
  ): INewClassSchedule[] => {
    return schedules
      .map((s) => {
        let initialClassDate: Date;

        if (s.type === ClassFrequency.OneTime) {
          initialClassDate = s.date;
        } else {
          initialClassDate = nextDay(new Date(), mapWeekdayToDayNumber(s.weekday));
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
      throw new BadRequestException(`Asset with ID ${imagePublicId} is not an image`);
    }
  };

  static assertInstructorExistInDojo = async (
    instructorId: string,
    dojoId: string,
    tx: Transaction,
  ) => {
    const dojoInstructor = await InstructorsRepository.findOneByIdAndDojoId(
      instructorId,
      dojoId,
      tx,
    );

    if (!dojoInstructor) {
      throw new NotFoundException(`Instructor with ID ${instructorId} not found for Dojo`);
    }

    return dojoInstructor;
  };

  static getEnrolledStudents = async (
    classId: string,
    txInstance?: Transaction,
  ): Promise<StudentWihUserDTO[]> => {
    const execute = async (tx: Transaction) => {
      const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByClassId(
        classId,
        tx,
      );

      if (enrollments.length === 0) {
        return [];
      }

      const studentIds = enrollments.map((e) => e.studentId);
      const studentRecords = await StudentRepository.fetchStudentsWithUsersByIds(studentIds, tx);

      return studentRecords.map((record) => {
        return new StudentWihUserDTO({
          id: record.student.id,
          studentUserId: record.student.studentUserId,
          parentId: record.student.parentId,
          experience: record.student.experienceLevel,
          studentUser: record.user,
        });
      });
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  // Get all classes from the dojo they own
  static getDojoClasses = async (user: IUser, txInstance?: Transaction): Promise<IClass[]> =>{
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.DojoAdmin) {
        throw new InternalServerErrorException("User is not a dojo admin");
      }

      const dojo = await DojoRepository.getDojoForOwner(user.id, tx);
      if (!dojo) {
        throw new NotFoundException("Dojo not found for user");
      }

      const classes = await ClassRepository.findAllByDojoId(dojo.id, tx);
      return classes;
    };
    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  // Get classes assigned to this instructor
  static getInstructorClasses = async (user: IUser, txInstance?: Transaction): Promise<IClass[]> =>{
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Instructor) {
        throw new InternalServerErrorException("User is not an instructor");
      }
      const instructor = await InstructorsRepository.findOneByUserId(user.id, tx);
      if (!instructor) {
        throw new NotFoundException("Instructor not found");
      }

      const classes = await ClassRepository.findAllByInstructorId(instructor.id, tx);
      return classes;
    };
    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  // Get classes where their children are enrolled
  static getParentClasses = async (user: IUser, txInstance?: Transaction): Promise<IClass[]> =>{
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Parent) {
        throw new InternalServerErrorException("User is not a parent");
      }

      const parent = await ParentRepository.getOneParentByUserId(user.id, tx);

      if (!parent) {
        throw new NotFoundException("Parent not found");
      }

      const studentsData = await StudentRepository.getStudentsByParentId(parent.id, tx);

      if (studentsData.length === 0) {
        return [];
      }

      const studentIds = studentsData.map((student) => student.student.id);

      const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByStudentIds(
        studentIds,
        tx,
      );

      if (enrollments.length === 0) {
        return [];
      }

      const classIds = enrollments.map((enrollment) => enrollment.classId);
      const uniqueClassIds = Array.from(new Set(classIds));

      return await ClassRepository.findClassesByIds(uniqueClassIds, tx);
    };
    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  // Get classes the student is enrolled in
  static getStudentClasses = async (user: IUser, txInstance?: Transaction): Promise<IClass[]> =>{
    const execute = async (tx: Transaction) => {
      if (user.role !== Role.Child) {
        throw new InternalServerErrorException("User is not a child");
      }

      const student = await StudentRepository.findOneByUserId(user.id, tx);

      if (!student) {
        throw new NotFoundException("Student not found");
      }

      const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByStudentIds(
        [student.id],
        tx,
      );

      if (enrollments.length === 0) {
        return [];
      }

      const classIds = enrollments.map((enrollment) => enrollment.classId);
      const uniqueClassIds = Array.from(new Set(classIds));

      return await ClassRepository.findClassesByIds(uniqueClassIds, tx);
    };
    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static getUserClasses = async (userId: string, txInstance?: Transaction): Promise<IClass[]> =>{

    const execute = async (tx: Transaction) => {
      const user = await UsersService.getOneUserByID({userId, txInstance: tx})
      if (!user) {
        throw new NotFoundException("User not Found");
      }

      switch (user.role) {
            case Role.DojoAdmin: {      
              return await ClassService.getDojoClasses(user, tx);
            }
      
            case Role.Instructor: {
              return await ClassService.getInstructorClasses(user, tx);
            }
      
            case Role.Parent: {
              return await ClassService.getParentClasses(user, tx);
            }
      
            case Role.Child: {
              return await ClassService.getStudentClasses(user, tx);
            }
      
            default:
              return [];
          }
    }

    return txInstance ? execute(txInstance): dbService.runInTransaction(execute)
  }
}
