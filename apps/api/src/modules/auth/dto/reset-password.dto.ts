import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: "token-recebido-por-email" })
  @IsString()
  token!: string;

  @ApiProperty({ example: "nova-senha-segura", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
