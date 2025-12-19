import { NotificationType } from "../constants/enums";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException";
import { NotificationRepository } from "../repositories/notification.repository";
import * as firebaseService from "./firebase.service";

export type BaseNotificationData = {};

export type SignUpSuccessfulNotificationData = {
  push_data: string;
};

export type NotificationData =
  | BaseNotificationData
  | SignUpSuccessfulNotificationData;

export const sendNotification = async ({
  type,
  fcmToken,
  userId,
  title,
  body = "",
  data,
}: {
  userId: string;
  fcmToken: string;
  title: string;
  body?: string;
  data: NotificationData;
  type: NotificationType;
}) => {
  try {
    const message = {
      token: fcmToken,
      data: data,
      notification: { title, body },
    };

    await NotificationRepository.create({
      type,
      userId: userId,
      title,
    });

    const response = await firebaseService.getFirebaseMessaging().send(message);
    console.log(`Successfully sent ${type} notification:`, response);
  } catch (error) {
    console.log(`Error sending ${type} notification:`, error);
    throw new InternalServerErrorException("Error Sending Notification");
  }
};
