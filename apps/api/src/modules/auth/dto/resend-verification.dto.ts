import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: "user@fluxcred.com" })
  @IsEmail()
  email!: string;
}
