import { NotificationType } from "../constants/enums.js";
import { InternalServerErrorException } from "../core/errors/index.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { FirebaseService } from "./firebase.service.js";

export type BaseNotificationData = {};

export type SignUpSuccessfulNotificationData = {
  screen: string;
};

export type NotificationData =
  | BaseNotificationData
  | SignUpSuccessfulNotificationData;

export class NotificationService {
  static sendAndSaveNotification = async ({
    type,
    user,
    title,
    body = "",
    data,
  }: {
    user: IUser;
    title: string;
    body?: string;
    data: NotificationData;
    type: NotificationType;
  }) => {
    try {
      await NotificationRepository.create({
        type,
        userId: user.id,
        title,
        message: body,
      });

      if (!user.fcmToken) {
        // Return early if there's no FCM token
        return;
      }

      const message = {
        token: user.fcmToken,
        data: data,
        notification: { title, body },
      };

      const response = await FirebaseService.getFirebaseMessaging().send(
        message
      );
      console.log(`Successfully sent ${type} notification:`, response);
    } catch (error) {
      console.log(`Error sending ${type} notification:`, error);
      throw new InternalServerErrorException("Error Sending Notification");
    }
  };

  static sendSignUpNotification = async (user: IUser) => {
    const title = "Welcome to Dojo Connect!";
    const body = "Your Dojo Admin account has been created successfully.";
    const data: SignUpSuccessfulNotificationData = {
      screen: "complete_profile",
    };

    await this.sendAndSaveNotification({
      type: NotificationType.SignUp,
      user,
      title,
      body,
      data,
    });
  };
}
