import { Request, Response } from "express";
import { InstructorService } from "../services/instructor.service.js";
import { StudentService } from "../services/student.service.js";

export class InstructorController {
  static async handleAcceptInvite(req: Request, res: Response) {
    await InstructorService.acceptInvite(req.body);

    res.status(200).json({
      data: undefined,
      message: "Invite accepted successfully",
    });
  }

  static async handleFetchInviteDetails(req: Request, res: Response) {
    const token = req.params.token as string;

    const inviteDetails = await InstructorService.getInviteDetails(token);

    res.status(200).json({
      data: inviteDetails,
      message: "Invite details fetched successfully",
    });
  }

  static async handleDeclineInvite(req: Request, res: Response) {
    await InstructorService.declineInvite(req.body);

    res.status(200).json({
      data: undefined,
      message: "Invite declined successfully",
    });
  }

  static async getInstructorClasses(req: Request, res: Response) {
    const instructorId = req.params.instructorId as string;

    const classes = await InstructorService.getInstructorClasses(instructorId);

    res.status(200).json({
      data: classes,
      message: "Instructor classes fetched successfully",
    });
  }

  static async handleFetchInstructorStudents(req: Request, res: Response) {
    const instructorId = req.params.instructorId as string;

    const students = await StudentService.fetchAllInstructorStudents(instructorId);

    res.status(200).json({
      data: students.map((s) => s.toJSON()),
      message: "Instructor students fetched successfully",
    });
  }
}
