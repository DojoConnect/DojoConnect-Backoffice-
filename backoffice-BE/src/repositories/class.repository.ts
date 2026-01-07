import { and, eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { classes, classSchedules } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { Transaction } from "../db/index.js";
import { ClassStatus } from "../constants/enums.js";

export type IClass = InferSelectModel<typeof classes>;
export type INewClass = InferInsertModel<typeof classes>;
export type IClassSchedule = InferSelectModel<typeof classSchedules>;
export type INewClassSchedule = InferInsertModel<typeof classSchedules>;

export type IUpdateClass = Partial<Omit<INewClass, "id" | "createdAt">>;

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
  ): Promise<(IClass & { schedules: IClassSchedule[] }) | null> {
    const result = await tx
      .select()
      .from(classes)
      .leftJoin(classSchedules, eq(classes.id, classSchedules.classId))
      .where(eq(classes.id, classId));

    if (result.length === 0) {
      return null;
    }

    const classData = result[0].classes;
    const schedules = result
      .map((row) => row.class_schedules)
      .filter((schedule) => schedule !== null) as IClassSchedule[];

    return {
      ...classData,
      schedules,
    };
  }

  static async findAllByDojoId(
    dojoId: string,
    tx: Transaction
  ): Promise<IClass[]> {
    const result = await tx
      .select()
      .from(classes)
      .where(
        and(eq(classes.dojoId, dojoId), eq(classes.status, ClassStatus.Active))
      );

    return result;
  }

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
