import { InferInsertModel } from "drizzle-orm";
import * as dbService from "../db";

import { notifications } from "../db/schema";

type INewNotification = InferInsertModel<typeof notifications>;

export class NotificationRepository {
  static create = async (notification: INewNotification) => {
    await dbService.getDB().insert(notifications).values(notification);
  };
}
