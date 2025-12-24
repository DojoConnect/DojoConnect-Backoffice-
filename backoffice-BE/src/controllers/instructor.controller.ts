import { Request, Response } from "express";
import { InstructorService } from "../services/instructor.service.js";

export class InstructorController {
  static async handleAcceptInvite(req: Request, res: Response) {}

  static async handleFetchInviteDetails(req: Request, res: Response) {
    const { token } = req.params;

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
}
