import { Transaction } from "../db/index.js";
import * as dbService from "../db/index.js";
import { IUser } from "../repositories/user.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { ClassEnrollmentRepository as EnrollmentRepository } from "../repositories/enrollment.repository.js";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import { StripeService } from "./stripe.service.js";
import { 
  NotFoundException, 
  ForbiddenException, 
  ConflictException, 
  BadRequestException 
} from "../core/errors/index.js";
import { ClassSubscriptionType, BillingStatus } from "../constants/enums.js";
import { and, eq, or } from "drizzle-orm";
import { classSubscriptions } from "../db/schema.js";

export class EnrollmentService {
  static enrollStudent = async ({
    parentUser,
    classId,
    studentId,
    txInstance,
  }: {
    parentUser: IUser;
    classId: string;
    studentId: string;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // 1. Retrieve Student
      const student = await StudentRepository.findOneById(studentId, tx);
      if (!student) {
        throw new NotFoundException("Student not found");
      }

      // 2. Validate Parent Ownership
      const parent = await ParentRepository.getOneParentByUserId(parentUser.id, tx);
      if (!parent) {
         throw new ForbiddenException("User is not a registered parent");
      }

      if (student.parentId !== parent.id) {
        throw new ForbiddenException("You are not authorized to enroll this student");
      }

      // 3. Retrieve Class
      const dojoClass = await ClassRepository.findById(classId, tx);
      if (!dojoClass) {
        throw new NotFoundException("Class not found");
      }

      // 4. Validate Capacity
      const currentEnrollments = await EnrollmentRepository.fetchActiveEnrollmentsByClassId(classId, tx);
      
      const activeEnrollmentsCount = currentEnrollments.filter(e => e.active).length;
      
      if (activeEnrollmentsCount >= dojoClass.capacity) {
        throw new ConflictException("Class is fully booked");
      }

      // 5. Validate Active Enrollment
      const existingEnrollment = await EnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId(
        classId,
        studentId,
        tx
      );

      if (existingEnrollment) {
        throw new ConflictException("Student is already actively enrolled in this class");
      }

      if (dojoClass.subscriptionType === ClassSubscriptionType.Free) {
       // Free Class - Direct Enrollment
        await EnrollmentRepository.create({
            classId,
            studentId,
            active: true
        }, tx);

        return {
            status: 'enrolled',
            checkoutUrl: null
        }; 
      }

      // 6. Handle Subscription/Payment Logic
      if (dojoClass.subscriptionType === ClassSubscriptionType.Paid) {
        // Validate no active subscription
        const activeSub = await SubscriptionRepository.findOneActiveClassSubByClassIdAndStudentId(
          classId,
          studentId,
          tx
        );

        if (activeSub) {
           throw new ConflictException("Active subscription already exists for this class");
        }

        // Create Checkout Session
        const checkoutSession = await StripeService.createClassSubCheckOut({
            dojoClass,
            parent,
            student
        });

        if (!checkoutSession.url) {
            throw new BadRequestException("Failed to create checkout session");
        }

        return {
            status: 'checkout_required',
            checkoutUrl: checkoutSession.url
        };

      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
