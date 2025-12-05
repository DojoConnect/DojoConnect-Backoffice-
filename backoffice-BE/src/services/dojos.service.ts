import { NotFoundException } from "../core/errors/NotFoundException";
import { getDBConnection } from "./db.service";

export const fetchDojoBySlug = async (slug: string) => {
  const dbConnection = await getDBConnection();

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
