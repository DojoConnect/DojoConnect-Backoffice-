import { UserDTO, UserDTOParams } from "./user.dtos";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDTOParams extends AuthTokens {
  user: UserDTOParams;
}

export class AuthResponseDTO implements AuthResponseDTOParams {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;

  constructor(params: AuthResponseDTOParams) {
    this.accessToken = params.accessToken;
    this.refreshToken = params.refreshToken;
    this.user = new UserDTO(params.user);
  }

  toJSON() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      user: this.user.toJSON(),
    };
  }
}

export interface RegisterDojoAdminResponseDTOParams
  extends AuthResponseDTOParams {
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
