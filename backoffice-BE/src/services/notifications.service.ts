import {
  InstructorInviteStatus,
  NotificationType,
} from "../constants/enums.js";
import { InstructorInviteDetails } from "../repositories/invites.repository.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { IUser } from "../repositories/user.repository.js";
import { capitalize, getFullName } from "../utils/text.utils.js";
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

  static notifyDojoOwnerOfInviteResponse = async ({
    user,
    inviteDetails,
    status,
  }: {
    user: IUser;
    inviteDetails: InstructorInviteDetails;
    status: InstructorInviteStatus.Accepted | InstructorInviteStatus.Declined;
  }) => {
    const title = `Instructor Invite ${capitalize(status)}`;
    const body = `${getFullName(
      inviteDetails.firstName,
      inviteDetails.lastName
    )} has ${status} your invite to become an instructor for ${
      inviteDetails.dojoName
    }.`;

    await this.sendAndSaveNotification({
      type: NotificationType.InvitationResponse,
      user,
      title,
      body,
      data: {},
    });
  };

  static sendInviteAcceptedNotification = async (
    user: IUser,
    inviteDetails: InstructorInviteDetails
  ) => {
    const title = "Invite Accepted";
    const body = `You accepted the invite to become an instructor for ${inviteDetails.dojoName}.`;

    await this.sendAndSaveNotification({
      type: NotificationType.InvitationAccepted,
      user,
      title,
      body,
      data: {},
    });
  };

  static notifyDojoOwnerOfClassCreation = async ({
    dojoOwner,
    className,
  }: {
    dojoOwner: IUser;
    className: string;
  }) => {
    const title = "New Class Created";
    const body = `Your class "${className}" was created successfully.`;

    await this.sendAndSaveNotification({
      type: NotificationType.ClassCreated,
      user: dojoOwner,
      title,
      body,
      data: {},
    });
  };
}
