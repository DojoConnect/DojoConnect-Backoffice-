import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { students } from "../db/schema.js";
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
}
