import { eq, InferSelectModel } from "drizzle-orm";
import * as dbService from "../db";
import { dojos } from "../db/schema";

export type IDojo = InferSelectModel<typeof dojos>;

export const findOne = <T>(rows: T[]): T | null => rows[0] ?? null;

export const fetchDojoBySlug = async (slug: string): Promise<IDojo | null> => {
  try {
    const dojo = findOne(
      await dbService.getDB()
        .select()
        .from(dojos)
        .where(eq(dojos.dojoTag, slug))
        .limit(1)
        .execute()
    );

    if (!dojo) {
      return null;
    }

    return dojo;
  } catch (err: any) {
    console.error(`Error fetching dojo by slug: ${slug}`, { err });
    throw new Error(err);
  }
};

export const fetchDojoByID = async (dojoId: number): Promise<IDojo | null> => {
  try {
    const dojo = findOne(
      await dbService
        .getDB()
        .select()
        .from(dojos)
        .where(eq(dojos.id, dojoId))
        .limit(1)
        .execute()
    );

    if (!dojo) {
      return null;
    }

    return dojo;
  } catch (err: any) {
    console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
    throw new Error(err);
  }
};
