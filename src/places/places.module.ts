import { Module } from "@nestjs/common";
import { PlacesController } from "./places.controller";
import { PlacesService } from "./places.service";
import { GoogleApiService } from "./google-api.service";

@Module({
  controllers: [PlacesController],
  providers: [PlacesService, GoogleApiService],
  exports: [PlacesService, GoogleApiService],
})
export class PlacesModule {}
