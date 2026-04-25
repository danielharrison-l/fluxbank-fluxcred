import { IsIn } from "class-validator";

export const DEMO_PROFILES = ["approved", "rejected"] as const;

export type DemoProfile = (typeof DEMO_PROFILES)[number];

export class ConnectDemoProfileDto {
  @IsIn(DEMO_PROFILES)
  profile!: DemoProfile;
}
