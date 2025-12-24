import { Request, Response } from "express";
import { InstructorService } from "../services/instructor.service.js";

export class InstructorController {
  static async handleAcceptInvite(req: Request, res: Response) {}

  static async fetchInviteDetails(req: Request, res: Response) {
    const { token } = req.params;

    const inviteDetails = await InstructorService.getInviteDetails(token);

    res.status(200).json({
      data: inviteDetails,
      message: "Invite details fetched successfully",
    });
  }
}
