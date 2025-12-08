import { NotFoundException } from "../core/errors/NotFoundException";
import * as dbService from "./db.service";

export interface IDojo {
  id: number;
  name: string;
  email: string;
  role: string;
  dojo_id: number;
  dojo_name: string;
  dojo_tag: string;
  tagline: string;
  description: string;
  created_at: Date;
}

export const fetchDojoBySlug = async (slug: string): Promise<IDojo|null> => {
  try {
    const dbConnection = await dbService.getBackOfficeDB();

    const [rows] = await dbConnection.execute(
      `SELECT id, name, email, role, dojo_id, dojo_name, dojo_tag, tagline, description, created_at
       FROM users
       WHERE dojo_tag = ?`,
      [slug]
    );

    if ((rows as any[]).length === 0) {
      return null;
    }

    return rows[0];
  } catch (err: any) {
    console.error(`Error fetching dojo by slug: ${slug}`, {err});
    throw new Error(err);
  }
};

export const fetchDojoByID = async (dojoId: string): Promise<IDojo|null> => {
  try {
    const dbConnection = await dbService.getBackOfficeDB();

    const [rows] = await dbConnection.execute(
      `SELECT id, name, email, role, dojo_id, dojo_name, dojo_tag, tagline, description, created_at
       FROM users
       WHERE id = ?`,
      [dojoId]
    );

    if ((rows as any[]).length === 0) {
      return null;
    }

    return rows[0];
  } catch (err: any) {
    console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
    throw new Error(err);
  }
};
