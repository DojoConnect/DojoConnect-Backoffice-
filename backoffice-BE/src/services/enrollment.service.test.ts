import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentService } from "./enrollment.service.js";
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
    vi.mocked(StudentRepository.findOneById)
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce({ ...mockStudent, id: "student-456" });
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
    vi.mocked(EnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
    vi.mocked(EnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue(null);
    vi.mocked(EnrollmentRepository.create).mockResolvedValue("enrollment-id");

    const result = await EnrollmentService.enrollStudents({
      parentUser: mockParentUser,
      classId: "class-123",
      studentIds: ["student-123", "student-456"],
    });

    expect(result).toEqual({ status: "enrolled", checkoutUrl: null });
    expect(EnrollmentRepository.create).toHaveBeenCalledTimes(2);
  });

  it("should return checkout url for paid class with multiple students", async () => {
      const paidClass = { ...mockClass, subscriptionType: ClassSubscriptionType.Paid, stripePriceId: "price_123" };
      vi.mocked(StudentRepository.findOneById)
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce({ ...mockStudent, id: "student-456" });
      vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
      vi.mocked(ClassRepository.findById).mockResolvedValue(paidClass);
      vi.mocked(EnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
      vi.mocked(EnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue(null);
      vi.mocked(SubscriptionRepository.findOneActiveClassSubByClassIdAndStudentId).mockResolvedValue(null);
      vi.mocked(StripeService.createClassSubCheckOut).mockResolvedValue({ url: "https://stripe.com/checkout" } as any);

      const result = await EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123", "student-456"],
      });

      expect(result).toEqual({ status: "checkout_required", checkoutUrl: "https://stripe.com/checkout" });
      // Verify Stripe Service called with correct list
      expect(StripeService.createClassSubCheckOut).toHaveBeenCalledWith(expect.objectContaining({
          students: expect.arrayContaining([expect.objectContaining({ id: "student-123" }), expect.objectContaining({ id: "student-456" })])
      }));
  });

  it("should throw error if any student not found", async () => {
    vi.mocked(StudentRepository.findOneById).mockResolvedValue(null);
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);

    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-999"],
    })).rejects.toThrow(NotFoundException);
  });

  it("should throw error if parent not authorized for any student", async () => {
     vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
     vi.mocked(StudentRepository.findOneById).mockResolvedValue({ ...mockStudent, parentId: "other-parent" });
     vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);

     await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123"],
    })).rejects.toThrow(ForbiddenException);
  });

  it("should throw error if class does not have enough capacity", async () => {
    vi.mocked(StudentRepository.findOneById).mockResolvedValue(mockStudent);
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue({ ...mockClass, capacity: 2 });
    // Already has 1 active enrollment
    vi.mocked(EnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([{ active: true } as any]);

    // Try to enroll 2 more (1+2 > 2)
    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123", "student-456"],
    })).rejects.toThrow(ConflictException);
  });

  it("should throw error if any student already enrolled", async () => {
    vi.mocked(StudentRepository.findOneById).mockResolvedValue(mockStudent);
    vi.mocked(ParentRepository.getOneParentByUserId).mockResolvedValue(mockParent);
    vi.mocked(ClassRepository.findById).mockResolvedValue(mockClass);
    vi.mocked(EnrollmentRepository.fetchActiveEnrollmentsByClassId).mockResolvedValue([]);
    vi.mocked(EnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId).mockResolvedValue({ id: "1" } as any);

    await expect(EnrollmentService.enrollStudents({
        parentUser: mockParentUser,
        classId: "class-123",
        studentIds: ["student-123"],
    })).rejects.toThrow(ConflictException);
  });
});
