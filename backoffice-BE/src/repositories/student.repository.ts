import { InferInsertModel, InferSelectModel, SQL, eq, inArray } from "drizzle-orm";
import { students, users } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IStudent = InferSelectModel<typeof students>;
export type INewStudent = InferInsertModel<typeof students>;

export class StudentRepository {
  static create = async (student: INewStudent, tx: Transaction) => {
    const [insertResult] = await tx
      .insert(students)
      .values(student)
      .$returningId();

    return insertResult.id;
  };

  static getStudentsAndUserByParentId = async (
    parentId: string,
    tx: Transaction
  ) => {
    return await tx
      .select({
        student: students,
        user: users,
      })
      .from(students)
      .innerJoin(users, eq(students.studentUserId, users.id))
      .where(eq(students.parentId, parentId));
  };

  static getStudentsByParentId = async (
    parentId: string,
    tx: Transaction
  ) => {
    return await tx
      .select({
        student: students,
      })
      .from(students)
      .where(eq(students.parentId, parentId));
  };

  static async findOne(
        whereClause: SQL | undefined,
        tx: Transaction
      ): Promise<IStudent | null> {
        const student = returnFirst(
          await tx.select().from(students).where(whereClause).limit(1).execute()
        );
    
        return student || null;
      }

  static findOneById = async (studentId: string, tx: Transaction) => {
    return await this.findOne(eq(students.id, studentId), tx);
  };

  static fetchStudentsByIds = async (studentIds: string[], tx: Transaction) => {
    return await tx.select().from(students).where(inArray(students.id, studentIds)); 
  }

  static fetchStudentsWithUsersByIds = async (studentIds: string[], tx: Transaction) => {
    return await tx
      .select({
        student: students,
        user: users,
      })
      .from(students)
      .innerJoin(users, eq(students.studentUserId, users.id))
      .where(inArray(students.id, studentIds));
  };
}
