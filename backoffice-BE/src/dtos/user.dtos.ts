import { Role } from "../constants/enums.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { BaseDojoDTO } from "./dojo.dtos.js";

export interface UserDTOParams {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
  role: Role;
  balance: string;
  dob: Date | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: Date;
  dojo?: IDojo|null;
}

export class UserDTO implements UserDTOParams {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
  role: Role;
  balance: string;
  dob: Date | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: Date;
  dojo?: BaseDojoDTO;


  constructor(params: UserDTOParams) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
    this.username = params.username;
    this.avatar = params.avatar;
    this.role = params.role;
    this.balance = params.balance;
    this.dob = params.dob;
    this.gender = params.gender;
    this.city = params.city;
    this.street = params.street;
    this.createdAt = params.createdAt;
    if (params.dojo) {
      this.dojo = new BaseDojoDTO(params.dojo);
    }
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
      balance: this.balance,
      dob: this.dob,
      gender: this.gender,
      city: this.city,
      street: this.street,
      createdAt: this.createdAt,
      dojo: this.dojo ? this.dojo.toJSON() : undefined,
    };
  }
}
