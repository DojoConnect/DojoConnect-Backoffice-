import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentService } from "./enrollment.service.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import { StripeService } from "./stripe.service.js";
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "../core/errors/index.js";
import { ClassSubscriptionType } from "../constants/enums.js";

vi.mock("../repositories/student.repository.js");
vi.mock("../repositories/parent.repository.js");
vi.mock("../repositories/class.repository.js");
vi.mock("../repositories/enrollment.repository.js");
vi.mock("../repositories/subscription.repository.js");
vi.mock("./stripe.service.js");
vi.mock("../db/index.js", () => ({
  runInTransaction: (fn: any) => fn("mockTx"),
}));

describe("EnrollmentService", () => {
    const mockParentUser = { id: "user-123", parentId: "parent-123" } as any;
    const mockStudent = { id: "student-123", parentId: "parent-123" } as any;
    const mockParent = { id: "parent-123", userId: "user-123", stripeCustomerId: "cus_123" } as any;
    const mockClass = { 
        id: "class-123", 
        capacity: 10, 
        subscriptionType: ClassSubscriptionType.Free,
        stripePriceId: "price_123"
    } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enroll multiple students in free class successfully", async () => {
    vi.mocked(StudentRepository.fetchStudentsWithUsersByIds)
        .mockResolvedValue([
            { student: mockStudent, user: { ...mockParentUser, firstName: "John", lastName: "Doe" } },
            { student: { ...mockStudent, id: "student-456" }, user: { ...mockParentUser, firstName: "Jane", lastName: "Doe" } } 
        ] as any);
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
    vi.mocked(ClassEnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
    vi.mocked(ClassEnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue(null);
    vi.mocked(ClassEnrollmentRepository.create).mockResolvedValue("enrollment-id");

    const result = await EnrollmentService.enrollStudents({
      parentUser: mockParentUser,
      classId: "class-123",
      studentIds: ["student-123", "student-456"],
    });

    expect(result).toEqual({ status: "enrolled", clientSecret: null, customerId: null });
    expect(ClassEnrollmentRepository.create).toHaveBeenCalledTimes(2);
  });

  it("should return checkout url for paid class with multiple students", async () => {
      const paidClass = { ...mockClass, subscriptionType: ClassSubscriptionType.Paid, stripePriceId: "price_123" };
      vi.mocked(StudentRepository.fetchStudentsWithUsersByIds)
        .mockResolvedValue([
            { student: mockStudent, user: { ...mockParentUser, firstName: "John", lastName: "Doe" } },
            { student: { ...mockStudent, id: "student-456" }, user: { ...mockParentUser, firstName: "Jane", lastName: "Doe" } } 
        ] as any);
      vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
      vi.mocked(ClassRepository.findById).mockResolvedValue(paidClass);
      vi.mocked(ClassEnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
      vi.mocked(ClassEnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue(null);
      vi.mocked(SubscriptionRepository.findOneActiveClassSubByClassIdAndStudentId).mockResolvedValue(null);
      vi.mocked(StripeService.createEnrollmentPaymentIntent).mockResolvedValue({ client_secret: "pi_secret_123" } as any);
      vi.mocked(StripeService.retrievePrice).mockResolvedValue({ unit_amount: 1000, currency: "gbp" } as any);
      vi.mocked(ParentRepository.update).mockResolvedValue(undefined as any);

      const result = await EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123", "student-456"],
      });

      expect(result).toEqual({ status: "payment_required", clientSecret: "pi_secret_123", customerId: "cus_123" });
      // Verify Stripe Service called with correct list
      expect(StripeService.createEnrollmentPaymentIntent).toHaveBeenCalled();
  });

  it("should throw error if any student not found", async () => {
    vi.mocked(StudentRepository.fetchStudentsWithUsersByIds).mockResolvedValue([]); // No students found
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);

    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-999"],
    })).rejects.toThrow(NotFoundException);
  });

  it("should throw error if parent not authorized for any student", async () => {
     vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
     vi.mocked(StudentRepository.fetchStudentsWithUsersByIds).mockResolvedValue([{ student: { ...mockStudent, parentId: "other-parent" }, user: {} } as any]);
     vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);

     await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123"],
    })).rejects.toThrow(ForbiddenException);
  });

  it("should throw error if class does not have enough capacity", async () => {
    vi.mocked(StudentRepository.fetchStudentsWithUsersByIds)
        .mockResolvedValue([
            { student: mockStudent, user: { ...mockParentUser, firstName: "John", lastName: "Doe" } },
            { student: { ...mockStudent, id: "student-456" }, user: { ...mockParentUser, firstName: "Jane", lastName: "Doe" } } 
        ] as any);
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue({ ...mockClass, capacity: 2 });
    // Already has 1 active enrollment
    vi.mocked(ClassEnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([{ active: true } as any]);

    // Try to enroll 2 more (1+2 > 2)
    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123", "student-456"],
    })).rejects.toThrow(ConflictException);
  });

  it("should throw error if any student already enrolled", async () => {
    vi.mocked(StudentRepository.fetchStudentsWithUsersByIds).mockResolvedValue([{ student: mockStudent, user: {} } as any]);
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
    vi.mocked(ClassEnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
    vi.mocked(ClassEnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue({ id: "1" } as any);

    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123"],
    })).rejects.toThrow(ConflictException);
  });
});
