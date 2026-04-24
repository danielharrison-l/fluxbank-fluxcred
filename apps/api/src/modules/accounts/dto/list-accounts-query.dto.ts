import { IsOptional, IsString } from "class-validator";

export class ListAccountsQueryDto {
  @IsOptional()
  @IsString()
  pluggyItemId?: string;
}
