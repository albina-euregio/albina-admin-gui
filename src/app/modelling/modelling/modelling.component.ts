import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { BaseMapService } from "../../providers/map-service/base-map.service";
import { ModellingService, ZamgModelPoint } from "../modelling.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { QfaService } from "app/providers/qfa-service/qfa.service";
import { ParamService } from "app/providers/qfa-service/param.service";
import { LatLngLiteral } from 'leaflet';
import * as qfaTypes from "../../qfa/types/QFA";

export interface MultiselectDropdownData {
  id: string;
  name: string;
}

@Component({
  templateUrl: "./modelling.component.html",
  styleUrls: ["../../qfa/qfa.component.scss", "../../qfa/table.scss", "../../qfa/params.scss"]
})
export class ModellingComponent implements AfterViewInit, OnDestroy {
  zamgTypes = ["", "eps_ecmwf", "eps_claef"];
  selectedModelPoint: ZamgModelPoint;
  selectedModelType: "default" | "eps_ecmwf" | "eps_claef";
  selectedCity: string;
  showMap: boolean = true;
  visibleLayers: string[] = [];
  qfa: any;
  qfaStartDay: number;
  showQfa: boolean = false;
  dropDownOptions = {
    "default": [],
    "qfa": [],
    "eps_ecmwf": [],
    "eps_claef": []
  };
  public readonly allSources: MultiselectDropdownData[] = [
    {
      id: "default",
      name: "multimodel"
    },
    {
      id: "qfa",
      name: "QFA"
    },
    {
      id: "eps_ecmwf",
      name: "eps_ecmwf"
    },
    {
      id: "eps_claef",
      name: "eps_claef"
    }
  ]
  qfaPoints = {
    "bozen": {
      lng: 11.33,
      lat: 46.47
    },
    "innsbruck": {
      lng: 11.35,
      lat: 47.27
    },
    "lienz": {
      lng: 12.80,
      lat: 46.83
    }
  };

  @ViewChild("mapDiv") mapDiv: ElementRef<HTMLDivElement>;

  constructor(
    public mapService: BaseMapService,
    private modellingService: ModellingService,
    private constantsService: ConstantsService,
    private qfaService: QfaService,
    private paramService: ParamService,
  ) {}

  files = {}

  async ngAfterViewInit() {
    this.initMaps();
    this.files = await this.qfaService.getFiles();
    console.log(this.files);
  }

  initMaps() {
    this.mapService.initMaps(this.mapDiv.nativeElement, () => {});
    this.mapService.addControls();
    this.zamgTypes.forEach((zamgType: "" | "eps_ecmwf" | "eps_claef") => {
      this.modellingService.getZamgModelPoints({ zamgType }).subscribe((zamgModelPoints) => {
        const type = zamgType || "default";
        this.dropDownOptions[type] = zamgModelPoints;
        zamgModelPoints.forEach(point => {
          const ll: LatLngLiteral = {
            lat: type === "eps_claef" ? (point.lat+0.0001) : point.lat,
            lng: type === "eps_claef" ? (point.lng-0.002) : point.lng
          };
          const callback = {
            callback: this.onClickZamgModelPoint,
            parameters: {
              point: point,
              type: type,
            },
            context: this,
          }
          this.mapService.drawMarker(
            ll,
            this.getModelPointOptions(type),
            type,
            callback);
        })
      });
    })

    for(const [cityName, coords] of Object.entries(this.qfaPoints)) {
      const ll: LatLngLiteral = coords;
      const callback = {
        callback: this.onClickQfa,
        parameters: cityName,
        context: this
      }
      this.mapService.drawMarker(
        ll,
        this.getModelPointOptions("qfa"),
        "qfa",
        callback
      );
    }
  }

  ngOnDestroy() {
    if (this.mapService.map) {
      this.mapService.map.remove();
      this.mapService.map = undefined;
    }
  }

  getModelPointOptions(type) {
    const fillColors = {
      "default": this.constantsService.colorBrand,
      "qfa": "red",
      "eps_ecmwf": "yellow",
      "eps_claef": "green",
    }

    return {
      radius: 8,
      fillColor: fillColors[type],
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  }

  onClickZamgModelPoint(ll: LatLngLiteral, params) {
    this.selectedModelPoint = params.point;
    this.selectedModelType = params.type;
    this.showMap = false;
  }

  setShowMap() {
    this.showMap = true;
    this.showQfa = false;
    this.selectedModelPoint = {} as ZamgModelPoint;
  }

  onClickQfa(ll: LatLngLiteral, params) {
    this.setQfa(this.files[params][0], 0);
    this.selectedModelPoint = undefined;
    this.showMap = false;
    this.showQfa = true;
  }

  onDropdownSelect(id, event) {
    this.visibleLayers = event.value;
    this.mapService.removeMarkerLayers();
    if(this.visibleLayers.length) {
      this.visibleLayers.forEach(layerName => {
        this.mapService.addMarkerLayer(layerName);
      })
    } else {
      this.allSources.forEach(source => {
        this.mapService.addMarkerLayer(source.id);
      })
    }
  }

  onChangeQfa(event) {
    this.setQfa(event.target.value, 0);
  }

  async setQfa(file, startDay) {
    this.qfaStartDay = startDay;
    const fileMap = typeof file === "string" ? {filename: file} : file;
    this.qfa = await this.qfaService.getRun(fileMap, startDay);
    this.selectedCity = this.qfa.data.metadata.location.split(" ").pop().toLowerCase();
    this.paramService.setParameterClasses(this.qfa.parameters);
  }
}
