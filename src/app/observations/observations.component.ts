import { Component, OnInit, AfterViewInit } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ObservationsService } from "../providers/observations-service/observations.service";
import { MapService } from "../providers/map-service/map.service";
import { Natlefs } from "../models/natlefs.model";
import { SimpleObservation } from "app/models/avaobs.model";
import * as Enums from "../enums/enums";

import * as L from "leaflet";

@Component({
  templateUrl: "observations.component.html"
})
export class ObservationsComponent  implements OnInit, AfterViewInit {

  public dateRange: Date[] = [this.observationsService.startDate, this.observationsService.endDate];
  public elevationRange = [200, 4000];
  public aspects: string[] = [];
  public activeNatlefs: Natlefs;

  constructor(
    private constantsService: ConstantsService,
    private observationsService: ObservationsService,
    private authenticationService: AuthenticationService,
    private mapService: MapService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initMaps();
    this.loadObservations();
  }

  loadObservations() {
    this.observationsService.startDate = this.dateRange[0];
    this.observationsService.endDate = this.dateRange[1];
    this.mapService.observationLayers.AvaObs.clearLayers();
    this.mapService.observationLayers.Natlefs.clearLayers();
    this.mapService.observationLayers.Lawis.clearLayers();
    this.loadAvaObs();
    this.loadNatlefs();
    this.loadLawis();
  }

  private initMaps() {
    if (this.mapService.observationsMap) {
      this.mapService.observationsMap.remove();
    }

    const map = L.map("map", {
      zoomControl: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      touchZoom: true,
      center: L.latLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
      zoom: 8,
      minZoom: 8,
      maxZoom: 16,
      layers: [this.mapService.observationsMaps.AlbinaBaseMap, this.mapService.observationLayers.Natlefs, this.mapService.observationLayers.AvaObs, this.mapService.observationLayers.Lawis]
    });

    L.control.scale().addTo(map);
    L.control.layers(this.mapService.observationsMaps, this.mapService.observationLayers, {position: "bottomright"}).addTo(map)

    this.mapService.observationsMap = map;
  }

  private async loadAvaObs() {
    const { observations, simpleObservations, snowProfiles } = await this.observationsService.getAvaObs();
    observations.forEach((o) => this.createAvaObsMarker(o, "blue", "https://www.avaobs.info/observation/" + o.uuId));
    simpleObservations.forEach((o) => this.createAvaObsMarker(o, "green", "https://www.avaobs.info/simpleObservation/" + o.uuId));
    snowProfiles.forEach((o) => this.createAvaObsMarker(o, "red", "https://www.avaobs.info/snowprofile/" + o.uuId));
  }

  private createAvaObsMarker(o: SimpleObservation, color: string, url: string) {
    if (!o.positionLat || !o.positionLng) {
      return;
    }
    L.circleMarker(L.latLng(o.positionLat, o.positionLng), this.mapService.createNatlefsOptions(color))
      .bindTooltip(o.placeDescription)
      .on({ click: () => window.open(url) })
      .addTo(this.mapService.observationLayers.AvaObs);
  }

  private async loadNatlefs() {
    try {
      const data = await this.observationsService.getNatlefs();
      data.forEach((natlefs) => this.createNatlefsMarker(natlefs));
    } catch (error) {
      console.error("NATLEFS could not be loaded from server: " + JSON.stringify(error._body));
    }
  }

  private createNatlefsMarker(natlefs: Natlefs) {
    const { latitude, longitude } = natlefs?.location?.geo ?? {};
    if (!latitude || !longitude || !this.inElevationRange(natlefs?.location?.elevation)) {
      return;
    }
    L.circleMarker(L.latLng(latitude, longitude), this.mapService.createNatlefsOptions())
      .on({ click: () => this.setActiveNatlefs(natlefs) })
      .addTo(this.mapService.observationLayers.Natlefs);
  }

  setActiveNatlefs(natlefs: Natlefs | undefined) {
    this.activeNatlefs = natlefs;
  }

  private async loadLawis() {
    try {
      const profiles = await this.observationsService.getLawis();
      profiles.forEach(({ latitude, longitude, seehoehe, exposition_id, ort, profil_id }) => {
        const aspect = Enums.Aspect[exposition_id];
        if (!latitude || !longitude || !this.inElevationRange(seehoehe) || !this.inAspects(aspect)) {
          return;
        }
        L.circleMarker(L.latLng(latitude, longitude), this.mapService.createNatlefsOptions("orange"))
          .bindTooltip(ort)
          .on({ click: () => window.open(this.constantsService.lawisApi.profilePDF.replace("{{id}}", String(profil_id))) })
          .addTo(this.mapService.observationLayers.Lawis);
      });
    } catch (error) {
      console.error("Failed fetching lawis.at profiles", error);
    }
  }

  private inElevationRange(elevation: number | undefined) {
    return elevation === undefined || (this.elevationRange[0] <= elevation && elevation <= this.elevationRange[1]);
  }

  private inAspects(aspect: string) {
    return !this.aspects.length || (typeof aspect === "string" && this.aspects.includes(aspect.toUpperCase()));
  }
}
