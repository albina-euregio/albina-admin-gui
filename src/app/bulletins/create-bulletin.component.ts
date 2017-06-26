import { Component, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from 'ng2-translate/src/translate.service';
import { BulletinsService } from '../providers/bulletins-service/bulletins.service';
import { SettingsService } from '../providers/settings-service/settings.service';
import { BulletinModel } from '../models/bulletin.model';
import { BulletinInputModel } from '../models/bulletin-input.model';
import * as Enums from '../enums/enums';
import { MapService } from "../providers/map-service/map.service";
import { UUID } from 'angular2-uuid';
import 'rxjs/add/operator/switchMap';
import { ConfirmDialogModule, ConfirmationService, SharedModule } from 'primeng/primeng';

import "leaflet";

@Component({
  templateUrl: 'create-bulletin.component.html'
})
export class CreateBulletinComponent {

  public bulletinStatus = Enums.BulletinStatus;

  public originalBulletins: Map<string, BulletinModel>;

  public editRegions: boolean;

  public aggregatedRegionsIds: string[];
  public aggregatedRegionsMap: Map<string, BulletinInputModel>;
  public activeAggregatedRegionId: string;
  public activeBulletinInput: BulletinInputModel;

  public activeAvalancheSituationHighlight: string;
  public activeAvalancheSituationComment: string;

  public activeSnowpackStructureHighlight: string;
  public activeSnowpackStructureComment: string;

  public hasDaytimeDependency: boolean;
  public hasElevationDependency: boolean;

  public loading: boolean;

  constructor(
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private bulletinsService: BulletinsService,
    private translateService: TranslateService,
    private settingsService: SettingsService,
    private mapService: MapService,
    private confirmationService: ConfirmationService)
  {
    this.loading = true;
  }

  ngOnInit() {
    this.originalBulletins = new Map<string, BulletinModel>();
    this.aggregatedRegionsMap = new Map<string, BulletinInputModel>();
    this.aggregatedRegionsIds = new Array<string>();
    this.activeAggregatedRegionId = undefined;
    this.activeBulletinInput = undefined;
    this.activeAvalancheSituationHighlight = undefined;
    this.activeAvalancheSituationComment = undefined;
    this.activeSnowpackStructureHighlight = undefined;
    this.activeSnowpackStructureComment = undefined;
    this.hasElevationDependency = false;
    this.hasDaytimeDependency = false;
    this.editRegions = false;

    // TODO wait until bulletins are loaded (disable inputs)

    this.bulletinsService.loadBulletins(this.bulletinsService.getActiveDate()).subscribe(
      data => {
        let response = data.json();
        for (let jsonBulletin of response) {
          let bulletin = BulletinModel.createFromJson(jsonBulletin);
          console.log(JSON.stringify(bulletin.toJson()));
          this.addBulletin(bulletin);
        }
        this.loading = false;
      },
      error => {
        console.error("Bulletins could not be loaded!");
        // TODO show toast, navigate back
        this.loading = false;
      }
    );

    let map = L.map("map", {
        zoomControl: false,
        center: L.latLng(46.05, 11.07),
        zoom: 8,
        minZoom: 7,
        maxZoom: 9,
        layers: [this.mapService.baseMaps.OpenMapSurfer_Grayscale, this.mapService.overlayMaps.aggregatedRegions]
    });

    L.control.zoom({ position: "topleft" }).addTo(map);
    //L.control.layers(this.mapService.baseMaps).addTo(map);
    L.control.scale().addTo(map);

    this.mapService.map = map;
  }

  ngOnDestroy() {
    this.bulletinsService.setActiveDate(undefined);
    this.bulletinsService.setIsEditable(false);

    // TODO unlock via socketIO

    this.loading = false;
  }

  addBulletin(bulletin: BulletinModel) {
    this.originalBulletins.set(bulletin.getId(), bulletin);

    // a bulletin for this aggregated region is already in the map => use existend bulletin input object
    if (this.aggregatedRegionsMap.has(bulletin.getAggregatedRegionId())) {
      if (bulletin.below) {
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).elevationDependency = true;
      }
      // TODO check if this a good method
      if (bulletin.validFrom.getHours() == 12) {
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).daytimeDependency = true;
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).afternoonBelow = bulletin.below;
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).afternoonAbove = bulletin.above;
      // TODO check if this a good method
      } else if (bulletin.validFrom.getHours() == 0) {
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).forenoonBelow = bulletin.below;
        this.aggregatedRegionsMap.get(bulletin.getAggregatedRegionId()).forenoonAbove = bulletin.above;
      }
    // no bulletin with the aggregated region id is present => create a new bulletin input object
    } else {
      let bulletinInput = new BulletinInputModel();
      bulletinInput.regions = bulletin.regions;
      bulletinInput.avalancheSituationHighlight = bulletin.avalancheSituationHighlight;
      bulletinInput.avalancheSituationComment = bulletin.avalancheSituationComment;
      bulletinInput.snowpackStructureHighlight = bulletin.snowpackStructureHighlight;
      bulletinInput.snowpackStructureComment = bulletin.snowpackStructureComment;
      bulletinInput.elevation = bulletin.elevation;
      if (bulletin.elevation > 0 && bulletin.below) {
        bulletinInput.elevationDependency = true;
      }
      // TODO check if this a good method
      if (bulletin.validFrom.getHours() == 12) {
        bulletinInput.daytimeDependency = true;
        bulletinInput.afternoonBelow = bulletin.below;
        bulletinInput.afternoonAbove = bulletin.above;
      // TODO check if this a good method
      } else if (bulletin.validFrom.getHours() == 0) {
        bulletinInput.forenoonBelow = bulletin.below;
        bulletinInput.forenoonAbove = bulletin.above;
      }

      this.mapService.addAggregatedRegion(bulletinInput, false);

      this.aggregatedRegionsMap.set(bulletin.getAggregatedRegionId(), bulletinInput);
      this.aggregatedRegionsIds.push(bulletin.getAggregatedRegionId());
    }
  }

  createAggregatedRegion() {

    // TODO lock region (Tirol, Südtirol or Trentino) via socketIO

    let uuid = UUID.UUID();
    let bulletinInput = new BulletinInputModel();
    this.aggregatedRegionsMap.set(uuid, bulletinInput);
    this.aggregatedRegionsIds.push(uuid);

    this.selectAggregatedRegion(uuid);
  }

  selectAggregatedRegion(aggregatedRegionId: string) {
    // save text parts
    if (this.activeBulletinInput) {
      this.activeBulletinInput.setAvalancheSituationHighlightIn(this.activeAvalancheSituationHighlight, this.settingsService.getLang());
      this.activeBulletinInput.setAvalancheSituationCommentIn(this.activeAvalancheSituationComment, this.settingsService.getLang());
    }

    this.activeAggregatedRegionId = aggregatedRegionId;
    this.activeBulletinInput = this.aggregatedRegionsMap.get(aggregatedRegionId);
    this.activeAvalancheSituationHighlight = this.activeBulletinInput.getAvalancheSituationHighlightIn(this.settingsService.getLang());
    this.activeAvalancheSituationComment = this.activeBulletinInput.getAvalancheSituationCommentIn(this.settingsService.getLang());

    this.mapService.selectAggregatedRegion(this.activeBulletinInput);
  }

  deselectAggregatedRegion() {
    this.mapService.deselectRegions(this.activeBulletinInput);

    this.activeAggregatedRegionId = undefined;
    this.activeBulletinInput = undefined;
    this.activeAvalancheSituationHighlight = undefined;
    this.activeAvalancheSituationComment = undefined;
  }

  deleteAggregatedRegion(aggregatedRegionId: string) {
    this.confirmationService.confirm({
      header: this.translateService.instant("bulletins.create.deleteAggregatedRegionDialog.header"),
      message: this.translateService.instant("bulletins.create.deleteAggregatedRegionDialog.message"),
      accept: () => {
        this.aggregatedRegionsMap.delete(aggregatedRegionId);

        var index = this.aggregatedRegionsIds.indexOf(aggregatedRegionId);
        if (index > -1)
          this.aggregatedRegionsIds.splice(index, 1);

        this.deselectAggregatedRegion();

        // TODO unlock region (Tirol, Südtirol or Trentino) via socketIO

      }
    });
  }

  editAggregatedRegion(aggregatedRegionId: string) {

    // TODO lock whole day in TN, check if any aggregated region is locked

    this.editRegions = true;
    this.mapService.editAggregatedRegion(this.activeBulletinInput);
  }

  saveAggregatedRegion(aggregatedRegionId: string) {
    this.editRegions = false;

    // save selected regions to active bulletin input
    let regions = this.mapService.getSelectedRegions();
    this.activeBulletinInput.setRegions(regions);
    this.mapService.resetAggregatedRegions();

    // delete regions from other aggregated regions (one region can only be within one aggregated region on this day)
    this.aggregatedRegionsMap.forEach((value: BulletinInputModel, key: string) => {
      if (key != this.activeAggregatedRegionId) {
        for (var j = regions.length - 1; j >= 0; j--) {
          let index = value.getRegions().indexOf(regions[j]);
          if (index != -1) {
            value.getRegions().splice(index, 1);
          }
        }
      }
      this.mapService.addAggregatedRegion(value, false);
    });
    this.mapService.discardAggregatedRegion();
    this.mapService.selectAggregatedRegion(this.activeBulletinInput);

    // TODO unlock whole day in TN
  }

  discardAggregatedRegion(aggregatedRegionId: string) {
    this.editRegions = false;
    this.mapService.discardAggregatedRegion();
    this.mapService.selectAggregatedRegion(this.activeBulletinInput);

    // TODO unlock whole day in TN
  }

  getColor(aggregatedRegionId) {
    let dangerRating = "";
    if (this.aggregatedRegionsMap.get(aggregatedRegionId) && this.aggregatedRegionsMap.get(aggregatedRegionId) != undefined && this.aggregatedRegionsMap.get(aggregatedRegionId).getHighestDangerRating())
      dangerRating = this.aggregatedRegionsMap.get(aggregatedRegionId).getHighestDangerRating().toString();

    if (dangerRating == "very_high") {
        return {
            color: 'black'
        }
    } else if (dangerRating == "high") {
        return {
            color: 'red'
        }
    } else if (dangerRating == "considerable") {
        return {
            color: 'orange'
        }
    } else if (dangerRating == "moderate") {
        return {
            color: 'yellow'
        }
    } else if (dangerRating == "low") {
        return {
            color: 'green'
        }
    } else {
        return {
            color: 'grey'
        }
    }
  }

  save() {
    let bulletins = Array<BulletinModel>();

    this.aggregatedRegionsMap.forEach((value: BulletinInputModel, key: string) => {
      // set snowpack structure texts
      if (this.activeSnowpackStructureHighlight != undefined && this.activeSnowpackStructureHighlight != "")
        value.setSnowpackStructureHighlightIn(this.activeSnowpackStructureHighlight, this.settingsService.getLang());
      if (this.activeSnowpackStructureComment != undefined && this.activeSnowpackStructureComment != "")
        value.setSnowpackStructureCommentIn(this.activeSnowpackStructureComment, this.settingsService.getLang());

      // create bulletins
      let b = value.toBulletins(key, this.bulletinsService.getActiveDate());
      for (var i = b.length - 1; i >= 0; i--) {
        bulletins.push(b[i]);
      }
    });

    // delete original bulletins
    this.originalBulletins.forEach((value: BulletinModel, key: string) => {
      console.log("[" + key + "] Delete bulletin ...");
      this.bulletinsService.deleteBulletin(key).subscribe(
        data => {
          console.log("Bulletin deleted on server.");
        },
        error => {
          console.error("Bulletin could not be deleted on server!");
        }
      );
    });

    for (var i = bulletins.length - 1; i >= 0; i--) {
      console.log("[" + bulletins[i].getId() + "] Save bulletin ...");
      this.bulletinsService.saveBulletin(bulletins[i]).subscribe(
        data => {
          console.log("[" + data.json().bulletinId + "] Bulletin saved on server.");
        },
        error => {
          console.error("Bulletins could not be saved on server!");
          // TODO show toast, try again?
        }
      );
    }

    this.goBack();
  }

  discard() {
    this.confirmationService.confirm({
      header: this.translateService.instant("bulletins.create.discardDialog.header"),
      message: this.translateService.instant("bulletins.create.discardDialog.message"),
      accept: () => {
        console.log("Bulletin: changes discarded.");
        this.goBack();
      }
    });
  }

  goBack() {
    this.mapService.resetAll();
    this.router.navigate(['/bulletins']);
    this.loading = false;
    this.editRegions = false;
  }
}