import { ExperienceLevel } from "../constants/enums.js";
import { IStudent } from "../repositories/student.repository.js";
import { UserDTO, UserDTOParams } from "./user.dtos.js";

export interface StudentWithUserDTOParams {
  id: string;
  studentUserId: string;
  parentId: string;
  experience: ExperienceLevel;
  studentUser: UserDTOParams;
}

export class StudentWihUserDTO {
  id: string;
  studentUserId: string;
  parentId: string;
  experience: ExperienceLevel;
  studentUser: UserDTO;

  constructor(params: StudentWithUserDTOParams) {
    this.id = params.id;
    this.studentUserId = params.studentUserId;
    this.parentId = params.parentId;
    this.experience = params.experience;
    this.studentUser = new UserDTO(params.studentUser);
  }

  toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      experience: this.experience,
      studentUser: this.studentUser.toJSON(),
    };
  }
}

export class StudentDTO implements IStudent {
  id: string;
  studentUserId: string;
  parentId: string;
  experienceLevel: ExperienceLevel;
  createdAt: string;

  constructor(params: IStudent) {
    this.id = params.id;
    this.studentUserId = params.studentUserId;
    this.parentId = params.parentId;
    this.experienceLevel = params.experienceLevel;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      userId: this.studentUserId,
      experience: this.experienceLevel,
      createdAt: this.createdAt,
    };
  }
}
