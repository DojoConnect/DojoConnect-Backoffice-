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


export const fetchDojoBySlug = async (slug: string) => {
  const dbConnection = await dbService.getDBConnection();

  const [rows] = await dbConnection.execute(
    `SELECT id, name, email, role, dojo_id, dojo_name, dojo_tag, tagline, description, created_at
       FROM users
       WHERE dojo_tag = ?`,
    [slug]
  );

  if ((rows as any[]).length === 0) {
    throw new NotFoundException(`Dojo with slug ${slug} not found`);
  }

  return rows[0];
};
