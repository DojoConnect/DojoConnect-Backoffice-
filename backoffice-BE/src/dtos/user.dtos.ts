import { Role } from "../constants/enums.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { IDojoInstructor } from "../repositories/instructors.repository.js";
import { IParent } from "../repositories/parent.repository.js";
import { IStudent } from "../repositories/student.repository.js";
import { BaseDojoDTO } from "./dojo.dtos.js";
import { DojoInstructorDTO } from "./instructor.dtos.js";
import { ParentDTO } from "./parent.dtos.js";
import { StudentDTO } from "./student.dtos.js";

export interface UserDTOParams {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
  role: Role;
  dob: Date | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: Date;
}

export interface DojoOwnerUserDTOParams extends UserDTOParams {
  dojo: IDojo;
}

export interface InstructorUserDTOParams extends UserDTOParams {
  instructor: IDojoInstructor;
}

export interface ParentUserDTOParams extends UserDTOParams {
  parent: IParent;
}

export interface StudentUserDTOParams extends UserDTOParams {
  student: IStudent;
}

export class UserDTO implements UserDTOParams {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
  role: Role;
  dob: Date | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: Date;

  constructor(params: UserDTOParams) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
    this.username = params.username;
    this.avatar = params.avatar;
    this.role = params.role;
    this.dob = params.dob;
    this.gender = params.gender;
    this.city = params.city;
    this.street = params.street;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      username: this.username,
      avatar: this.avatar,
      role: this.role,
      dob: this.dob,
      gender: this.gender,
      city: this.city,
      street: this.street,
      createdAt: this.createdAt,
    };
  }
}

export class DojoAdminUserDTO extends UserDTO implements DojoOwnerUserDTOParams {
  dojo: BaseDojoDTO;

  constructor(params: DojoOwnerUserDTOParams) {
    super(params);
    this.dojo = new BaseDojoDTO(params.dojo);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      dojo: this.dojo.toJSON(),
    };
  }
}

export class InstructorUserDTO extends UserDTO implements InstructorUserDTOParams {
  instructor: DojoInstructorDTO;

  constructor(params: InstructorUserDTOParams) {
    super(params);
    this.instructor = new DojoInstructorDTO(params.instructor);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      instructor: this.instructor.toJSON(),
    };
  }
}

export class StudentUserDTO extends UserDTO implements StudentUserDTOParams {
  student: StudentDTO;

  constructor(params: StudentUserDTOParams) {
    super(params);
    this.student = new StudentDTO(params.student);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      student: this.student.toJSON(),
    };
  }
}

export class ParentUserDTO extends UserDTO implements ParentUserDTOParams {
  parent: ParentDTO;

  constructor(params: ParentUserDTOParams) {
    super(params);
    this.parent = new ParentDTO(params.parent);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      parent: this.parent.toJSON(),
    };
  }
}
