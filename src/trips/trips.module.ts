import { Module } from "@nestjs/common";
import { TripsController } from "./trips.controller";
import { TripsService } from "./trips.service";
import { ItineraryGeneratorService } from "./generation/itinerary-generator.service";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [JobsModule],
  controllers: [TripsController],
  providers: [TripsService, ItineraryGeneratorService],
  exports: [ItineraryGeneratorService],
})
export class TripsModule {}
