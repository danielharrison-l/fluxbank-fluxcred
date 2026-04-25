import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SavePluggyItemDto {
  @ApiProperty({ example: "item-id-from-pluggy-connect" })
  @IsString()
  itemId!: string;
}
