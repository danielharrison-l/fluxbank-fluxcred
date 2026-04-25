import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@fluxcred.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strong-password" })
  @IsString()
  password!: string;
}
