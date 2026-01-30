import { ImageType } from "../constants/cloudinary.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { DojosService } from "./dojos.service.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { IUser } from "../repositories/user.repository.js";
import { Role } from "../constants/enums.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";

export class UploadService {
    static generateClassImageUploadSignature = async (user: IUser) => {
        if (user.role !== Role.DojoAdmin) {
            throw new UnauthorizedException("Unauthorized: Dojo Admin Only!");
        }

        const userDojo = await DojosService.fetchUserDojo({ user });
        
        if (!userDojo) {
            throw new NotFoundException("Dojo not found");
        }

        const context = `dojoId=${userDojo.id}|imageType=${ImageType.CLASS}`;
        return CloudinaryService.getCloudinarySignature({
            imageType: ImageType.CLASS,
            context,
            uploadFolder: `dojos/classes/tmp`,
        });
    }

    static generateProfileImageUploadSignature = async (user: IUser) => {
        const context = `userId=${user.id}|imageType=${ImageType.AVATAR}`;
        return CloudinaryService.getCloudinarySignature({
            imageType: ImageType.AVATAR,
            context,
            uploadFolder: `users/avatars/tmp`,
        });
    }
}