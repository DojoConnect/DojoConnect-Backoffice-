import { InferInsertModel, InferSelectModel, eq } from "drizzle-orm";
import { students, users } from "../db/schema.js";
import { Transaction } from "../db/index.js";

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

  static getStudentsByParentId = async (
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
      .where(eq(students.parentUserId, parentId));
  };
}
