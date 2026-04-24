import { IsString } from "class-validator";

export class SavePluggyItemDto {
  @IsString()
  itemId!: string;
}
