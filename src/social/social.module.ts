import { Module } from "@nestjs/common";
import { SocialController } from "./social.controller";
import { SocialService } from "./social.service";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [JobsModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
