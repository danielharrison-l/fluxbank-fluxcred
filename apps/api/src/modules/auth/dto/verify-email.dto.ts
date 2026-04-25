import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: "token-recebido-por-email" })
  @IsString()
  token!: string;
}
