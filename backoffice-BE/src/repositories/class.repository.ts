import { and, eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { classes, classSchedules } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { Transaction } from "../db/index.js";

import { ClassStatus } from "../constants/enums.js";
import { InstructorUserDetails } from "./user.repository.js";

export type IClass = InferSelectModel<typeof classes>;
export type INewClass = InferInsertModel<typeof classes>;
export type IClassSchedule = InferSelectModel<typeof classSchedules>;
export type INewClassSchedule = InferInsertModel<typeof classSchedules>;

export type IUpdateClass = Partial<Omit<INewClass, "id" | "createdAt">>;

export type ClassWithInstructor = IClass & {
  instructor: InstructorUserDetails | null;
};

export type SchedulesAndInstructor = {
  schedules: IClassSchedule[];
  instructor: InstructorUserDetails | null;
};

export type ClassWithSchedulesAndInstructor = IClass & SchedulesAndInstructor;

export class ClassRepository {
  static async create(
    {
      classData,
      schedulesData,
    }: { classData: INewClass; schedulesData: INewClassSchedule[] },
    tx: Transaction
  ) {
    const [insertResult] = await tx
      .insert(classes)
      .values(classData)
      .$returningId();

    await ClassRepository.createSchedules(schedulesData, insertResult.id, tx);

    return insertResult.id;
  }

  static async findById(
    classId: string,
    tx: Transaction
  ): Promise<IClass | null> {
    const result = returnFirst(
      await tx.select().from(classes).where(eq(classes.id, classId))
    );

    if (!result) {
      return null;
    }

    return result;
  }

  static async fetchClassSchedules(
    classId: string,
    tx: Transaction
  ): Promise<IClassSchedule[]> {
    return await tx
      .select()
      .from(classSchedules)
      .where(eq(classSchedules.classId, classId));
  }

  static async findAllByDojoId(
    dojoId: string,
    tx: Transaction
  ): Promise<IClass[]> {
    return await tx
      .select()
      .from(classes)
      .where(
        and(eq(classes.dojoId, dojoId), eq(classes.status, ClassStatus.Active))
      );
  }

  static findAllByInstructorId = async (
    instructorId: string,
    tx: Transaction
  ): Promise<IClass[]> => {
    return await tx
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.instructorId, instructorId),
          eq(classes.status, ClassStatus.Active)
        )
      );
  };

  static update = async ({
    classId,
    update,
    tx,
  }: {
    classId: string;
    update: IUpdateClass;
    tx: Transaction;
  }) => {
    await tx.update(classes).set(update).where(eq(classes.id, classId));
  };

  static async deleteSchedules(classId: string, tx: Transaction) {
    await tx.delete(classSchedules).where(eq(classSchedules.classId, classId));
  }

  static async createSchedules(
    schedulesData: INewClassSchedule[],
    classId: string,
    tx: Transaction
  ) {
    if (schedulesData.length === 0) return;

    const schedulesToInsert = schedulesData.map((schedule) => ({
      ...schedule,
      classId,
    }));

    await tx.insert(classSchedules).values(schedulesToInsert);
  }
}
