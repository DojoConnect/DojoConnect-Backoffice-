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
  static enrollStudents = async ({
    parentUser,
    classId,
    studentIds,
    txInstance,
  }: {
    parentUser: IUser;
    classId: string;
    studentIds: string[];
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // 1. Retrieve Class
      const dojoClass = await ClassRepository.findById(classId, tx);
      if (!dojoClass) {
        throw new NotFoundException("Class not found");
      }

      // 2. Retrieve All Students & Validate Ownership
      // Note: Middleware checks ownership, but we re-verify for consistency or if called internally
      const students =  await StudentRepository.fetchStudentsByIds(studentIds, tx); 
      
      const parent = await ParentRepository.getOneParentByUserId(parentUser.id, tx);
      if (!parent) {
         throw new ForbiddenException("User is not a registered parent");
      }

      for (const studentId of studentIds) {
          const student = students.find((s) => s.id === studentId);
          if (!student) throw new NotFoundException(`Student not found`);
          if (student.parentId !== parent.id) {
               throw new ForbiddenException(`You are not authorized to enroll student ${student.id}`);
          }
      }

      // 3. Validate Capacity
      const currentEnrollments = await EnrollmentRepository.fetchActiveEnrollmentsByClassId(classId, tx);
      const activeEnrollmentsCount = currentEnrollments.length;
      
      if (activeEnrollmentsCount + studentIds.length > dojoClass.capacity) {
        throw new ConflictException("Class does not have enough capacity for all students");
      }

      // 4. Validate Each Student (Existing Enrollment/Sub)
      for (const studentId of studentIds) {
          // Check Active Enrollment
          const existing = await EnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId(classId, studentId, tx);
          if (existing) {
              throw new ConflictException(`Student ${studentId} is already actively enrolled in this class`);
          }

          // Check Active Subscription (if paid)
          if (dojoClass.subscriptionType === ClassSubscriptionType.Paid) {
               const activeSub = await SubscriptionRepository.findOneActiveClassSubByClassIdAndStudentId(classId, studentId, tx);
               if (activeSub) {
                   throw new ConflictException(`Student ${studentId} already has an active subscription for this class`);
               }
          }
      }

      // 5. Process Enrollment
      if (dojoClass.subscriptionType === ClassSubscriptionType.Paid) {
          // Create Checkout Session for ALL students
           // We need to pass valid IStudent objects to StripeService. 
           // We already fetched them above. Cast to IStudent (we checked for nulls).
           const validStudents = students; 

           const checkoutSession = await StripeService.createClassSubCheckOut({
            dojoClass,
            parent,
            students: validStudents
           });

           if (!checkoutSession.url) {
                throw new BadRequestException("Failed to create checkout session");
           }

           return {
                status: 'checkout_required',
                checkoutUrl: checkoutSession.url
           };

      } else {
          // Free Class - Enroll All
          for (const studentId of studentIds) {
             await EnrollmentRepository.create({
                classId,
                studentId,
                active: true
            }, tx);
          }

          return {
            status: 'enrolled',
            checkoutUrl: null
          };
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };
}
