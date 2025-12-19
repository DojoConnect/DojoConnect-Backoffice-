import { Role, StripePlans } from "../constants/enums";

export interface UserDTOParams {
  id: string;
  name: string;
  email: string;
  referredBy: string | null;
  avatar: string | null;
  role: Role;
  balance: string;
  referralCode: string;
  dob: string | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: string;
}

export class UserDTO implements UserDTOParams {
  id: string;
  name: string;
  email: string;
  referredBy: string | null;
  avatar: string | null;
  role: Role;
  balance: string;
  referralCode: string;
  dob: string | null;
  gender: string | null;
  city: string | null;
  street: string | null;
  createdAt: string;

  constructor(params: UserDTOParams) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    this.referredBy = params.referredBy;
    this.avatar = params.avatar;
    this.role = params.role;
    this.balance = params.balance;
    this.referralCode = params.referralCode;
    this.dob = params.dob;
    this.gender = params.gender;
    this.city = params.city;
    this.street = params.street;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      referredBy: this.referredBy,
      avatar: this.avatar,
      role: this.role,
      balance: this.balance,
      referralCode: this.referralCode,
      dob: this.dob,
      gender: this.gender,
      city: this.city,
      street: this.street,
      createdAt: this.createdAt,
    };
  }
}
