import { ExperienceLevel } from "../constants/enums.js";
import { UserDTO, UserDTOParams } from "./user.dtos.js";

export interface StudentUserDTOParams {
    id: string;
    studentUserId: string;
    parentId: string;
    experience: ExperienceLevel;
    studentUser: UserDTOParams;
}

export class StudentUserDTO {
    id: string;
    studentUserId: string;
    parentId: string;
    experience: ExperienceLevel
    studentUser: UserDTO;

    constructor (params: StudentUserDTOParams)  {
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
            studentUser: this.studentUser.toJSON()
        }
    }
}