import { InferInsertModel } from "drizzle-orm";
import * as dbService from "../db/index.js";

import { notifications } from "../db/schema.js";

type INewNotification = InferInsertModel<typeof notifications>;

export class NotificationRepository {
  static create = async (notification: INewNotification) => {
    await dbService.getDB().insert(notifications).values(notification);
  };
}
