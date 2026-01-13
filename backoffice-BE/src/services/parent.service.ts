import {
  ConflictException,
} from "../core/errors/index.js";
import { Transaction } from "../db/index.js";
import * as dbService from "../db/index.js";
import { AddChildDTO } from "../dtos/parent.dtos.js";
import { IUser } from "../repositories/user.repository.js";
import { AuthService } from "./auth.service.js";
import { Role } from "../constants/enums.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { MailerService } from "./mailer.service.js";
import { NotificationService } from "./notifications.service.js";
import { UsersService } from "./users.service.js";
import { nanoid } from "nanoid";
import { StudentUserDTO } from "../dtos/student,dtos.js";

export class ParentService {
  static addChild = async ({
    parent,
    dto,
    txInstance,
  }: {
    parent: IUser;
    dto: AddChildDTO;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // Check if email already exists
      const existingUser = await UsersService.getOneUserByEmail({
        email: dto.email,
        txInstance: tx,
      });

      if (existingUser) {
        throw new ConflictException("User with this email already exists");
      }

      // Generate Username (firstname.lastname + random)
      const baseUsername = `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}`;
      const uniqueSuffix = nanoid(5); // Short random string
      const username = `${baseUsername}.${uniqueSuffix}`;

      // Generate Password (Parent's First Name)
      const password = parent.firstName.toLowerCase();

      // Create Child User
      const childUser = await AuthService.createUser({
        dto: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: password,
          username: username,
          fcmToken: null,
          dob: dto.dob
        },
        role: Role.Child,
        tx,
      });

      // Create Student Link
      const newStudentId = await StudentRepository.create(
        {
          studentUserId: childUser.id,
          parentUserId: parent.id,
          experienceLevel: dto.experience,
        },
        tx
      );

      // Send Emails (Non-blocking usually, but for simplicity we await or catch error inside service)
      // Run parallel for speed
      const results = await Promise.allSettled([
      // Send mail to Parent
      MailerService.sendChildAddedEmailToParent(
        parent.email,
        parent.firstName,
        dto.firstName,
        dto.email
      ),
      // Send mail to Child
      MailerService.sendChildWelcomeEmail(
        dto.email,
        dto.firstName,
        parent.firstName
      ),
      // Send Notifications
      NotificationService.sendChildAddedNotification(
        parent,
        dto.firstName
      ),
      NotificationService.sendWelcomeNotificationToChild(childUser)
    ]);

    if (results.some((result) => result.status === "rejected")) {
          console.log(
            "[Consumed Error]: An Error occurred while trying to send email and notification. Error: ",
            results.find((result) => result.status === "rejected")?.reason
          );
        }

      return  new StudentUserDTO({
        id: newStudentId,
        parentId: parent.id,
        studentUserId: childUser.id,
        experience: dto.experience,
        studentUser: childUser
      });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
