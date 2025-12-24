import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { classes } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { Transaction } from "../db/index.js";

export type IClass = InferSelectModel<typeof classes>;
export type INewClass = InferInsertModel<typeof classes>;
export type IUpdateClass = Partial<Omit<INewClass, "id" | "createdAt">>;

export class ClassRepository {
  static getOneById = async (id: string, tx: Transaction) => {
    return returnFirst(
      await tx
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1)
        .execute()
    );
  };
}
