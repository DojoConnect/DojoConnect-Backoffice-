import { and, eq, inArray, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { classEnrollments, dojos } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IClassEnrollment = InferSelectModel<typeof classEnrollments>;
export type INewClassEnrollment = InferInsertModel<typeof classEnrollments>;
export type IUpdateClassEnrollment = Partial<Omit<INewClassEnrollment, "id" | "createdAt">>;

export class ClassEnrollmentRepository {
    static create = async (
    data: INewClassEnrollment,
    tx: Transaction
  ) => {
    const [insertResult] = await tx.insert(classEnrollments).values(data).$returningId();
    return insertResult.id;
  };

  static async getOne(
      whereClause: SQL | undefined,
      tx: Transaction
    ): Promise<IClassEnrollment | null> {
      const dojo = returnFirst(
        await tx.select().from(classEnrollments).where(whereClause).limit(1).execute()
      );
  
      return dojo || null;
    }

static findOneByClassIdAndStudentId = async (
    classId: string,
    studentId: string,
    tx: Transaction
  ): Promise<IClassEnrollment | null> => {
    return this.getOne(
      and(eq(classEnrollments.classId, classId), eq(classEnrollments.studentId, studentId)),
      tx
    );
  };

  static fetchEnrollmentsByClassId = async (
    classId: string,
    tx: Transaction
  ): Promise<IClassEnrollment[]> => {
    return await tx
      .select()
      .from(classEnrollments)
      .where(eq(classEnrollments.classId, classId));
  };

  static fetchActiveEnrollmentsByClassId = async (
    classId: string,
    tx: Transaction
  ): Promise<IClassEnrollment[]> => {
    return await tx
      .select()
      .from(classEnrollments)
      .where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.active, true)));
  };

  static fetchActiveEnrollmentsByStudentIds = async (
    studentIds: string[],
    tx: Transaction
  ): Promise<IClassEnrollment[]> => {
    return await tx
      .select()
      .from(classEnrollments)
      .where(and(inArray(classEnrollments.studentId, studentIds), eq(classEnrollments.active, true)));
  };

  static update = async ({
      classEnrollmentId,
      update,
      tx,
    }: {
      classEnrollmentId: string;
      update: IUpdateClassEnrollment;
      tx: Transaction;
    }) => {
      await tx.update(classEnrollments).set(update).where(eq(classEnrollments.id, classEnrollmentId));
    };

    static updateByClassIdAndStudentId = async ({
      classId,
      studentId,
      update,
      tx,
    }: {
      classId: string;
      studentId: string;
      update: IUpdateClassEnrollment;
      tx: Transaction;
    }) => {
      await tx.update(classEnrollments).set(update).where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.studentId, studentId)));
    };

    static findOneActiveEnrollmentByClassIdAndStudentId = async (
      classId: string,
      studentId: string,
      tx: Transaction
    ): Promise<IClassEnrollment | null> => {
      return this.getOne(
        and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.studentId, studentId),
          eq(classEnrollments.active, true)
        ),
        tx
      );
    };

    static fetchActiveEnrollmentsByClassIds = async (
      classIds: string[],
      tx: Transaction
    ): Promise<IClassEnrollment[]> => {
        if (classIds.length === 0) return [];
        return await tx
            .select()
            .from(classEnrollments)
            .where(
                and(
                    inArray(classEnrollments.classId, classIds), 
                    eq(classEnrollments.active, true)
                )
            );
    };
}