import { InferInsertModel } from "drizzle-orm";
import * as dbService from "../db/index.js";

import { notifications } from "../db/schema.js";

type INewNotification = InferInsertModel<typeof notifications>;

export class NotificationRepository {
  static create = async (notification: INewNotification) => {
    dbService.runInTransaction(async (tx) => {
      await tx.insert(notifications).values(notification).execute();
    });
  };
}
