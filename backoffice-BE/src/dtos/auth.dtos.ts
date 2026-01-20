import { UserDTO } from "./user.dtos.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDTOParams extends AuthTokens {
  userDto: UserDTO;
}

export class AuthResponseDTO implements AuthResponseDTOParams {
  accessToken: string;
  refreshToken: string;
  userDto: UserDTO;

  constructor(params: AuthResponseDTOParams) {
    this.accessToken = params.accessToken;
    this.refreshToken = params.refreshToken;
    this.userDto = params.userDto;
  }

  toJSON() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      user: this.userDto.toJSON(),
    };
  }
}

export interface RegisterDojoAdminResponseDTOParams extends AuthResponseDTOParams {
  stripeClientSecret: string;
}

export class RegisterDojoAdminResponseDTO extends AuthResponseDTO {
  stripeClientSecret: string;

  constructor(params: RegisterDojoAdminResponseDTOParams) {
    super(params);
    this.stripeClientSecret = params.stripeClientSecret;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      stripeClientSecret: this.stripeClientSecret,
    };
  }
}
