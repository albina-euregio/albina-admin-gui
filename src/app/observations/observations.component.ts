import { Component, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core/src/translate.service';
import { AuthenticationService } from '../providers/authentication-service/authentication.service';
import { ConstantsService } from '../providers/constants-service/constants.service';
import { ObservationsService } from '../providers/observations-service/observations.service';
import { MapService } from "../providers/map-service/map.service";
import { QuickReportModel } from "../models/quick-report.model";
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute, Params } from '@angular/router';
import * as Enums from '../enums/enums';
import { ConfirmDialogModule, ConfirmationService, SharedModule } from 'primeng/primeng';

declare var L: any;

@Component({
  templateUrl: 'observations.component.html'
})
export class ObservationsComponent {

  public showQuickReport: boolean = false;
  public activeQuickReport: QuickReportModel;

  constructor(
    private translate: TranslateService,
    private observationsService: ObservationsService,
    private route: ActivatedRoute,
    private translateService: TranslateService,
    private authenticationService: AuthenticationService,
    private mapService: MapService,
    private constantsService: ConstantsService,
    private router: Router,
    private confirmationService: ConfirmationService)
  {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initMaps();

    this.mapService.layerGroups.observations.clearLayers();

    this.loadSnowProfiles();
    this.loadHastyPits();
    this.loadQuickReports();
    this.loadNatlefs();
  }

  private initMaps() {
    if (this.mapService.observationsMap)
      this.mapService.observationsMap.remove();

    let map = L.map("map", {
        zoomControl: false,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        touchZoom: true,
        center: L.latLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
        zoom: 8,
        minZoom: 8,
        maxZoom: 16,
        layers: [this.mapService.observationsMaps.OpenTopoMap, this.mapService.layerGroups.observations]
    });

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.scale().addTo(map);

    this.mapService.observationsMap = map;
  }

  private loadSnowProfiles() {
    this.observationsService.getSnowProfiles().subscribe(
      data => {
        let response = data.json();
        for (var i = response.length - 1; i >= 0; i--) {
            if (response[i].location && response[i].location.geo && response[i].location.geo.latitude && response[i].location.geo.longitude) {
              this.createSnowProfileMarker(response[i]);
                console.debug("Snow profile added.");
            } else {
                console.debug("No coordinates in snow profile.");
            }
        }
      },
      error => {
        console.error("Snow profiles could not be loaded from server: " + JSON.stringify(error._body));
      }
    );
  }

    private loadHastyPits() {
        this.observationsService.getHastyPits().subscribe(
          data => {
            let response = data.json();
            for (var i = response.length - 1; i >= 0; i--) {
                if (response[i].location && response[i].location.geo && response[i].location.geo.latitude && response[i].location.geo.longitude) {
                    this.createHastyPitMarker(response[i]);
                    console.debug("Hasty pit added.");
                } else {
                    console.debug("No coordinates in hasty pit.");
                }
            }
          },
          error => {
            console.error("Hasty pits could not be loaded from server: " + JSON.stringify(error._body));
          }
        );
    }

    private loadQuickReports() {
        this.observationsService.getQuickReports().subscribe(
          data => {
            let response = data.json();
            for (var i = response.length - 1; i >= 0; i--) {
                if (response[i].location && response[i].location.geo && response[i].location.geo.latitude && response[i].location.geo.longitude) {
                    this.createQuickReportMarker(response[i]);
                    console.debug("Quick report added.");
                } else {
                    console.debug("No coordinates in quick report.");
                }
            }
         },
          error => {
            console.error("Quick reports could not be loaded from server: " + JSON.stringify(error._body));
          }
        );
    }

    private loadNatlefs() {
        this.observationsService.getNatlefs().subscribe(
          data => {
            let response = data.json();
            for (var i = response.length - 1; i >= 0; i--) {
                if (response[i].location && response[i].location.geo && response[i].location.geo.latitude && response[i].location.geo.longitude) {
                    this.createNatlefsMarker(response[i]);
                    console.debug("NATLEFS added.");
                } else {
                    console.debug("No coordinates in NATLEFS.");
                }
            }
         },
          error => {
            console.error("Quick reports could not be loaded from server: " + JSON.stringify(error._body));
          }
        );
    }

    private createSnowProfileMarker(snowProfile) {
      new L.Marker(new L.LatLng(snowProfile.location.geo.latitude, snowProfile.location.geo.longitude), {icon: this.mapService.createSnowProfileMarker()})
          .on({click: () => this.snowProfileMarkerClicked(snowProfile)})
          .addTo(this.mapService.layerGroups.observations);
    }

    private createHastyPitMarker(hastyPit) {
      new L.Marker(new L.LatLng(hastyPit.location.geo.latitude, hastyPit.location.geo.longitude), {icon: this.mapService.createHastyPitMarker()})
          .on({click: () => this.hastyPitMarkerClicked(hastyPit)})
          .addTo(this.mapService.layerGroups.observations);
    }

    private createQuickReportMarker(quickReport) {
      new L.Marker(new L.LatLng(quickReport.location.geo.latitude, quickReport.location.geo.longitude), {icon: this.mapService.createQuickReportMarker()})
            .on({click: () => this.quickReportMarkerClicked(quickReport)})
            .addTo(this.mapService.layerGroups.observations);
    }

    private createNatlefsMarker(natlefs) {
      new L.Marker(new L.LatLng(natlefs.location.geo.latitude, natlefs.location.geo.longitude), {icon: this.mapService.createNatlefsMarker()})
            .on({click: () => this.quickReportMarkerClicked(natlefs)})
            .addTo(this.mapService.layerGroups.observations);
    }

    quickReportMarkerClicked(quickReport) {
      this.activeQuickReport = QuickReportModel.createFromJson(quickReport);

      let mapDiv = document.getElementById('mapDiv');
      let quickReportDiv = document.getElementById('quickReport');
      mapDiv.classList.remove("col-md-12");
      mapDiv.classList.add("col-md-7");
      this.mapService.centerObservationsMap(this.activeQuickReport.getInfo().getLocation().getLatitude(), this.activeQuickReport.getInfo().getLocation().getLongitude());

      this.showQuickReport = true;
    }

    snowProfileMarkerClicked(snowProfile) {
      this.activeQuickReport = undefined;

      let mapDiv = document.getElementById('mapDiv');
      mapDiv.classList.remove("col-md-7");
      mapDiv.classList.add("col-md-12");

      this.showQuickReport = false;
/*
      this.observationsService.getSnowProfile(snowProfile.serverId).subscribe(
        data => {
          let response = data.json();
          let snowProfile = SnowProfileModel.createFromJson(response);
          this.nav.push(NewSnowProfilePage, {
            snowProfile: snowProfile,
            disabled: true
          });
        },
        error => {
          let confirm = this.alertCtrl.create({
              title: this.translateService.instant("observations.snowProfileLoadingAlarm.title"),
              message: this.translateService.instant("observations.snowProfileLoadingAlarm.text"),
              buttons: [
                {
                  text: this.translateService.instant("observations.snowProfileLoadingAlarm.ok"),
                  handler: () => {
                  }
                }
              ]
            });
            confirm.present({ ev: event });
        }
      );
*/
    }

    hastyPitMarkerClicked(profile) {
      this.activeQuickReport = undefined;

      let mapDiv = document.getElementById('mapDiv');
      mapDiv.classList.remove("col-md-7");
      mapDiv.classList.add("col-md-12");

      this.showQuickReport = false;
/*
      this.observationsService.getHastyPit(profile.serverId).subscribe(
        data => {
          let response = data.json();
          let hastyPit = HastyPitModel.createFromJson(response);
          this.nav.push(NewHastyPitPage, {
            hastyPit: hastyPit,
            disabled: true
          });
        },
        error => {
          let confirm = this.alertCtrl.create({
              title: this.translateService.instant("observations.hastyPitLoadingAlarm.title"),
              message: this.translateService.instant("observations.hastyPitLoadingAlarm.text"),
              buttons: [
                {
                  text: this.translateService.instant("observations.hastyPitLoadingAlarm.ok"),
                  handler: () => {
                  }
                }
              ]
            });
            confirm.present({ ev: event });
        }
      );
*/
    }
}
