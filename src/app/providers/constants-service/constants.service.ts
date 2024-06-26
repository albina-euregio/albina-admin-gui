import { Injectable } from "@angular/core";
import { ForecastSource, ObservationSource, ObservationType } from "app/observations/models/generic-observation.model";
import { environment } from "../../../environments/environment";
import * as Enums from "../../enums/enums";
import * as pkg from "../../../../package.json";

@Injectable()
export class ConstantsService {
  public release = [pkg.name, pkg.version].join("@");
  public gitlab = pkg.bugs.url;
  public dependencies = Object.entries(pkg.dependencies).map(([name, version]) => ({
    name,
    version: version.replace(/^\^/, ""),
    homepage: `https://www.npmjs.com/package/${name}/v/${version.replace(/^\^/, "")}`,
  }));

  public snowpackModelsUrl: string = "https://avalanche.report/alpsolut/html/";

  public observationApi = {
    $: "https://admin.avalanche.report/observations",
    [ObservationType.Webcam]: "https://admin.avalanche.report/webcams",
    [ObservationSource.AvalancheWarningService]: "https://admin.avalanche.report/weather-stations",
    [ObservationSource.Observer]: "https://admin.avalanche.report/observers",
    [ObservationSource.SnowLine]: "https://static.avalanche.report/snow-fall-level-calculator/geojson/{{date}}.geojson",

    "lola-cads.info": "https://admin.avalanche.report/observations/www.lola-cads.info/api/LWDprocessPhotoURL",
    [ForecastSource.alpsolut_profile]: "https://admin.avalanche.report/observations/widget.alpsolut.eu/",
    [ForecastSource.multimodel]: "https://static.avalanche.report/zamg/zamg/",
    [ObservationSource.Lawis]: "https://admin.avalanche.report/lawis/public/",
    [ObservationSource.LoLaKronos]:
      "https://admin.avalanche.report/observations/lola-kronos.info/api/dataexport/dataFromToken/",
    [ObservationSource.WikisnowECT]: "https://admin.avalanche.report/observations/wikisnow/ect/ect-json.json",
    [ObservationSource.FotoWebcamsEU]:
      "https://admin.avalanche.report/observations/foto-webcam.eu/webcam/include/metadata.php",
    "private.foto-webcam.eu": "https://admin.avalanche.report/observations/private.foto-webcam.eu/",
    [ObservationSource.Panomax]: "https://admin.avalanche.report/observations/api.panomax.com/1.0",
  };

  // region (ISO-3166)
  public codeSwitzerland: string = "CH";
  public codeTyrol: string = "AT-07";
  public codeSouthTyrol: string = "IT-32-BZ";
  public codeTrentino: string = "IT-32-TN";
  public codeAran: string = "ES-CT-L";
  public codeAndorra: string = "AD";

  public codePiemonte: string = "IT-21";
  public codeAosta: string = "IT-23";
  public codeLombardia: string = "IT-25";
  public codeVeneto: string = "IT-34";
  public codeFriuliVeneziaGiulia: string = "IT-36";
  public codeMarche: string = "IT-57";

  public roleAdmin: string = "ADMIN";
  public roleForecaster: string = "FORECASTER";
  public roleForeman: string = "FOREMAN";
  public roleObserver: string = "OBSERVER";

  public mapBoundaryN: number = 48.0;
  public mapBoundaryE: number = 13.5;
  public mapBoundaryS: number = 45.0;
  public mapBoundaryW: number = 9.0;

  public autoSaveIntervall: number = 10000;

  public colorBrand = "#19ABFF";

  // micro regions elevation
  public microRegionsElevationHigh = "high";
  public microRegionsElevationLowHigh = "low_high";
  public microRegionsElevationLow = "low";

  // danger rating (color)
  public colorDangerRatingLow = "#CCFF66";
  public colorDangerRatingModerate = "#FFFF00";
  public colorDangerRatingConsiderable = "#FF9900";
  public colorDangerRatingHigh = "#FF0000";
  public colorDangerRatingVeryHigh = "#000000";
  // danger rating (bw)
  public colorDangerRatingLowBw = "#EFEFEF";
  public colorDangerRatingModerateBw = "#D8D8D8";
  public colorDangerRatingConsiderableBw = "#B0B0B0";
  public colorDangerRatingHighBw = "#888888";
  // TODO use EAWS color (most probably black)
  public colorDangerRatingVeryHighBw = "#666666";

  public colorDangerRatingMissing = "#969696";
  // TODO use correct color
  public colorDangerRatingNoSnow = "#A0522D";
  public colorActiveSelection = "#3852A4";

  public lineColor = "#000000";
  public lineWeight = 0.5;
  public lineOpacity = 0.3;

  public fillOpacityOwnSelected = 0.8;
  public fillOpacityOwnDeselected = 0.6;
  public fillOpacityOwnSelectedSuggested = 0.8;
  public fillOpacityOwnDeselectedSuggested = 0.6;

  public fillOpacityForeignSelected = 0.8;
  public fillOpacityForeignDeselected = 0.3;
  public fillOpacityForeignSelectedSuggested = 0.8;
  public fillOpacityForeignDeselectedSuggested = 0.3;

  public fillOpacityEditSelection = 0.4;

  public avActivityCommentTextcat: Record<Exclude<Enums.AvalancheProblem, "cornices" | "no_distinct_problem">, string> =
    {
      new_snow:
        '[{"curlyName":"Neuschnee01","line":0,"args":{"Neuschnee01§Der_Neuschnee":{"curlyName":"Neuschnee01§Der_Neuschnee","line":11,"args":{"Anzahl":{"curlyName":"Anzahl","line":1}}},"Eigenschaft_Neuschnee":{"curlyName":"Eigenschaft_Neuschnee","line":0}}},{"curlyName":"Neuschnee01","line":0,"args":{"Neuschnee01§Der_Neuschnee":{"curlyName":"Neuschnee01§Der_Neuschnee","line":15,"args":{"Er=der_Neuschnee":{"curlyName":"Er=der_Neuschnee","line":0}}},"Eigenschaft_Neuschnee":{"curlyName":"Eigenschaft_Neuschnee","line":4,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":1},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}}}}}},{"curlyName":"Neuschnee01","line":0,"args":{"Neuschnee01§Der_Neuschnee":{"curlyName":"Neuschnee01§Der_Neuschnee","line":0},"Eigenschaft_Neuschnee":{"curlyName":"Eigenschaft_Neuschnee","line":9,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":2,"args":{"vor_allem_an":{"curlyName":"vor_allem_an","line":3},"Expo":{"curlyName":"Expo","line":6},"über_Nord":{"curlyName":"über_Nord","line":0},"Expo°2":{"curlyName":"Expo°2","line":4}}},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}}}}}},{"curlyName":"Wetter04","line":0,"args":{"Wetter04§Es_fielen":{"curlyName":"Wetter04§Es_fielen","line":5,"args":{"Bis_wann":{"curlyName":"Bis_wann","line":4}}},"Gebiet0":{"curlyName":"Gebiet0","line":5},"oberhalb_von_Höhe_optional":{"curlyName":"oberhalb_von_Höhe_optional","line":1,"args":{"Höhe_m":{"curlyName":"Höhe_m","line":14}}},"Wetter04§wieviel_Schnee":{"curlyName":"Wetter04§wieviel_Schnee","line":0,"args":{"verbreitet":{"curlyName":"verbreitet","line":0},"Zahl":{"curlyName":"Zahl","line":9}}},"Wetter04§lokal_mehr.":{"curlyName":"Wetter04§lokal_mehr.","line":3,"args":{"Zahl":{"curlyName":"Zahl","line":11}}}}},{"curlyName":"Grösse01","line":0,"args":{"Hangart_Höhe_Gebiet_Einzugsgebiet":{"curlyName":"Hangart_Höhe_Gebiet_Einzugsgebiet","line":43,"args":{"vor_allem":{"curlyName":"vor_allem","line":1}}},"und_Hangart_Höhe_Gebiet_Einzugsgebiet":{"curlyName":"und_Hangart_Höhe_Gebiet_Einzugsgebiet","line":0},"warum_Höhe_Einzugsgebiet_wann":{"curlyName":"warum_Höhe_Einzugsgebiet_wann","line":5},"wieviele4":{"curlyName":"wieviele4","line":1},"Grösse_der_Lawinen":{"curlyName":"Grösse_der_Lawinen","line":7},"Lawinenart":{"curlyName":"Lawinenart","line":8},"möglich":{"curlyName":"möglich","line":1}}},{"curlyName":"Triebschnee15","line":0,"args":{"warum":{"curlyName":"warum","line":0,"args":{"zunehmendem":{"curlyName":"zunehmendem","line":10},"Wind_Richtung":{"curlyName":"Wind_Richtung","line":0},"Neuschnee_und":{"curlyName":"Neuschnee_und","line":1}}},"entstehen":{"curlyName":"entstehen","line":0},"wann_optional":{"curlyName":"wann_optional","line":1,"args":{"Zeit":{"curlyName":"Zeit","line":6}}},"wo_optional":{"curlyName":"wo_optional","line":2},"Triebschnee_Beschreibung2":{"curlyName":"Triebschnee_Beschreibung2","line":5}}},{"curlyName":"Verhältnisse01","line":0,"args":{"Verhältnisse01§Verhältnisse":{"curlyName":"Verhältnisse01§Verhältnisse","line":3},"Verhältnisse01§sind":{"curlyName":"Verhältnisse01§sind","line":0},"gefährlich_Verhältnisse":{"curlyName":"gefährlich_Verhältnisse","line":1}}},{"curlyName":"Gefährdung03","line":0,"args":{"Sicherheitsmassnahmen":{"curlyName":"Sicherheitsmassnahmen","line":4},"Gefährdung03§prüfen.":{"curlyName":"Gefährdung03§prüfen.","line":4}}}]',
      wind_slab:
        '[{"curlyName":"Wetter06","line":0,"args":{"Wetter06§Der_Wind":{"curlyName":"Wetter06§Der_Wind","line":1,"args":{"seit_wann1":{"curlyName":"seit_wann1","line":2}}},"Wetter06§Gebiet0":{"curlyName":"Wetter06§Gebiet0","line":5},"Wetter06§wie_stark":{"curlyName":"Wetter06§wie_stark","line":6,"args":{"teilweise":{"curlyName":"teilweise","line":7}}}}},{"curlyName":"Triebschnee07","line":0,"args":{"Der_Wind":{"curlyName":"Der_Wind","line":4},"Triebschnee07§verfrachtet_Schnee.":{"curlyName":"Triebschnee07§verfrachtet_Schnee.","line":3}}},{"curlyName":"Triebschnee061","line":0,"args":{"wann3":{"curlyName":"wann3","line":0,"args":{"Zeit":{"curlyName":"Zeit","line":6}}},"Triebschnee06§wachsen":{"curlyName":"Triebschnee06§wachsen","line":0},"die_Triebschneeansammlungen":{"curlyName":"die_Triebschneeansammlungen","line":1},"Triebschnee06§weiter":{"curlyName":"Triebschnee06§weiter","line":2}}},{"curlyName":"Triebschnee15","line":0,"args":{"warum":{"curlyName":"warum","line":0,"args":{"Neuschnee_und":{"curlyName":"Neuschnee_und","line":0},"zunehmendem":{"curlyName":"zunehmendem","line":18},"Wind_Richtung":{"curlyName":"Wind_Richtung","line":17}}},"entstehen":{"curlyName":"entstehen","line":0},"wann_optional":{"curlyName":"wann_optional","line":3,"args":{"am_seit_bis":{"curlyName":"am_seit_bis","line":1},"Tag2":{"curlyName":"Tag2","line":0},"Datum":{"curlyName":"Datum","line":0}}},"wo_optional":{"curlyName":"wo_optional","line":3,"args":{"vor_allem":{"curlyName":"vor_allem","line":3},"sowie_in_Höhe":{"curlyName":"sowie_in_Höhe","line":12}}},"Triebschnee_Beschreibung2":{"curlyName":"Triebschnee_Beschreibung2","line":10}}},{"curlyName":"Gefahrenplot02","line":0,"args":{"Gefahrenplot02§Die_Gefahrenstellen_liegen":{"curlyName":"Gefahrenplot02§Die_Gefahrenstellen_liegen","line":0},"Gefahrenplot02§Expo":{"curlyName":"Gefahrenplot02§Expo","line":2},"oberhalb_von_Höhe_optional":{"curlyName":"oberhalb_von_Höhe_optional","line":1,"args":{"Höhe_m":{"curlyName":"Höhe_m","line":18}}},"Gefahrenstellen05§und_an":{"curlyName":"Gefahrenstellen05§und_an","line":17,"args":{"oberhalb_von_Höhe_optional":{"curlyName":"oberhalb_von_Höhe_optional","line":0}}}}},{"curlyName":"Triebschnee08","line":0,"args":{"Die_Eigenschaft_TSA":{"curlyName":"Die_Eigenschaft_TSA","line":2},"Triebschnee08§entstehen":{"curlyName":"Triebschnee08§entstehen","line":2},"wo_TSA":{"curlyName":"wo_TSA","line":7,"args":{"vor_allem":{"curlyName":"vor_allem","line":1},"aller_Expositionen":{"curlyName":"aller_Expositionen","line":0},"und_im_Hochgebirge":{"curlyName":"und_im_Hochgebirge","line":0}}}}},{"curlyName":"Triebschnee17","line":0,"args":{"wo3":{"curlyName":"wo3","line":29},"entstehen":{"curlyName":"entstehen","line":0},"Triebschnee_Beschreibung2":{"curlyName":"Triebschnee_Beschreibung2","line":18}}},{"curlyName":"Triebschnee01","line":0,"args":{"Triebschnee_Beschreibung1":{"curlyName":"Triebschnee_Beschreibung1","line":5},"vom_Tag":{"curlyName":"vom_Tag","line":0},"Eigenschaft_Triebschnee.":{"curlyName":"Eigenschaft_Triebschnee.","line":9,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":2,"args":{"vor_allem_an":{"curlyName":"vor_allem_an","line":3},"Expo":{"curlyName":"Expo","line":2},"über_Nord":{"curlyName":"über_Nord","line":4},"Expo°2":{"curlyName":"Expo°2","line":6}}},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}},"schon1":{"curlyName":"schon1","line":1},"in_Randbereichen3":{"curlyName":"in_Randbereichen3","line":2}}}}}]',
      persistent_weak_layers:
        '[{"curlyName":"Flash01","line":0,"args":{"Flash01§Muster":{"curlyName":"Flash01§Muster","line":6},"Flash01§wo_wann":{"curlyName":"Flash01§wo_wann","line":3,"args":{"Hangart":{"curlyName":"Hangart","line":2,"args":{"vor_allem":{"curlyName":"vor_allem","line":1},"an_steilen":{"curlyName":"an_steilen","line":1}}}}}}},{"curlyName":"Altschnee02","line":0,"args":{"Schwachschichten":{"curlyName":"Schwachschichten","line":9},"Hangart_Höhe_Gebiet_optional":{"curlyName":"Hangart_Höhe_Gebiet_optional","line":2,"args":{"vor_allem2":{"curlyName":"vor_allem2","line":1},"an_steilen":{"curlyName":"an_steilen","line":1}}},"Altschnee02§Belastung":{"curlyName":"Altschnee02§Belastung","line":12,"args":{"stellenweise1":{"curlyName":"stellenweise1","line":8}}}}},{"curlyName":"Dies02","line":0,"args":{"Dies2":{"curlyName":"Dies2","line":1},"Hangart1":{"curlyName":"Hangart1","line":27,"args":{"Tourengelände":{"curlyName":"Tourengelände","line":0}}},"Höhenlage3":{"curlyName":"Höhenlage3","line":0},"Dies02§sowie":{"curlyName":"Dies02§sowie","line":1},"Hangart1°1":{"curlyName":"Hangart1°1","line":21},"Höhenlage3°1":{"curlyName":"Höhenlage3°1","line":4,"args":{"und_vor_allem":{"curlyName":"und_vor_allem","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}}}},{"curlyName":"Grösse04","line":0,"args":{"Die_Lawinen":{"curlyName":"Die_Lawinen","line":1},"oft_Hangart_Höhe_Gebiet":{"curlyName":"oft_Hangart_Höhe_Gebiet","line":0},"Grösse04§im_Altschnee":{"curlyName":"Grösse04§im_Altschnee","line":8},"Grösse04§und_gross_werden.":{"curlyName":"Grösse04§und_gross_werden.","line":14}}},{"curlyName":"Altschnee06","line":0,"args":{"Schwachschichten":{"curlyName":"Schwachschichten","line":1},"Altschnee06§erfordern_Vorsicht.":{"curlyName":"Altschnee06§erfordern_Vorsicht.","line":2}}},{"curlyName":"Altschnee03","line":0,"args":{"Alarmzeichen":{"curlyName":"Alarmzeichen","line":1},"Altschnee03§sowie_Alarmzeichen":{"curlyName":"Altschnee03§sowie_Alarmzeichen","line":0},"Altschnee03§weisen_auf_Gefahr_hin":{"curlyName":"Altschnee03§weisen_auf_Gefahr_hin","line":2}}}]',
      wet_snow:
        '[{"curlyName":"Nassschnee05","line":0,"args":{"Nassschnee05§Die_Gefahr":{"curlyName":"Nassschnee05§Die_Gefahr","line":1,"args":{"von_Lawinenart2":{"curlyName":"von_Lawinenart2","line":46}}},"Anstieg_Abnahme":{"curlyName":"Anstieg_Abnahme","line":7}}},{"curlyName":"Nassschnee09","line":0,"args":{"Nassschnee09§wann_warum":{"curlyName":"Nassschnee09§wann_warum","line":6},"von_Lawinenart":{"curlyName":"von_Lawinenart","line":6},"Nassschnee09§wo_Höhe":{"curlyName":"Nassschnee09§wo_Höhe","line":2,"args":{"vor_allem3":{"curlyName":"vor_allem3","line":1},"an_steilen":{"curlyName":"an_steilen","line":1},"Höhe_Höhenlage":{"curlyName":"Höhe_Höhenlage","line":12}}},"Nassschnee09§wie_stark":{"curlyName":"Nassschnee09§wie_stark","line":3}}},{"curlyName":"Nassschnee07","line":0,"args":{"Nassschnee07§wie_gefroren":{"curlyName":"Nassschnee07§wie_gefroren","line":3},"Nassschnee07§und":{"curlyName":"Nassschnee07§und","line":1},"Nassschnee07§weicht_auf.":{"curlyName":"Nassschnee07§weicht_auf.","line":2}}},{"curlyName":"Nassschnee08","line":0,"args":{"Nassschnee08§Nach_klarer_Nacht":{"curlyName":"Nassschnee08§Nach_klarer_Nacht","line":0},"Nassschnee08§wo":{"curlyName":"Nassschnee08§wo","line":1},"Nassschnee08§recht":{"curlyName":"Nassschnee08§recht","line":1},"Nassschnee08§günstige_Verhältnisse":{"curlyName":"Nassschnee08§günstige_Verhältnisse","line":0},"Nassschnee08§dann_Anstieg.":{"curlyName":"Nassschnee08§dann_Anstieg.","line":2}}},{"curlyName":"Nassschnee10","line":0,"args":{"Nassschnee10§wann":{"curlyName":"Nassschnee10§wann","line":5},"Nassschnee10§dann_vermehrt":{"curlyName":"Nassschnee10§dann_vermehrt","line":5,"args":{"einige":{"curlyName":"einige","line":0},"wann_warum":{"curlyName":"wann_warum","line":5}}},"Nassschnee10§Lawinenart":{"curlyName":"Nassschnee10§Lawinenart","line":2},"möglich":{"curlyName":"möglich","line":1}}},{"curlyName":"Grösse01","line":0,"args":{"Hangart_Höhe_Gebiet_Einzugsgebiet":{"curlyName":"Hangart_Höhe_Gebiet_Einzugsgebiet","line":1,"args":{"vor_allem":{"curlyName":"vor_allem","line":0},"an_steilen":{"curlyName":"an_steilen","line":1},"Expo":{"curlyName":"Expo","line":3},"Komma_Expo":{"curlyName":"Komma_Expo","line":5},"und_Expo":{"curlyName":"und_Expo","line":6}}},"und_Hangart_Höhe_Gebiet_Einzugsgebiet":{"curlyName":"und_Hangart_Höhe_Gebiet_Einzugsgebiet","line":28,"args":{"in_Höhenlage2":{"curlyName":"in_Höhenlage2","line":1}}},"warum_Höhe_Einzugsgebiet_wann":{"curlyName":"warum_Höhe_Einzugsgebiet_wann","line":17},"wieviele4":{"curlyName":"wieviele4","line":1},"Grösse_der_Lawinen":{"curlyName":"Grösse_der_Lawinen","line":9},"Lawinenart":{"curlyName":"Lawinenart","line":22},"möglich":{"curlyName":"möglich","line":1}}},{"curlyName":"Verhältnisse02","line":0,"args":{"Verhältnisse02§wo_wann3":{"curlyName":"Verhältnisse02§wo_wann3","line":8},"gebietsweise":{"curlyName":"gebietsweise","line":1},"Gefahrenstufe_x":{"curlyName":"Gefahrenstufe_x","line":3},"Gefahr":{"curlyName":"Gefahr","line":12}}},{"curlyName":"Nassschnee011","line":0,"args":{"warum_wo_Höhe":{"curlyName":"warum_wo_Höhe","line":20},"Gefahr":{"curlyName":"Gefahr","line":1},"Zeit_optional":{"curlyName":"Zeit_optional","line":19},"wie_stark1":{"curlyName":"wie_stark1","line":2},"Nassschnee011§auf_Gefahrenstufe_n":{"curlyName":"Nassschnee011§auf_Gefahrenstufe_n","line":0}}}]',
      gliding_snow:
        '[{"curlyName":"Gleitschnee01","line":0,"args":{"Gleitschnee01§Zonen_unterhalb":{"curlyName":"Gleitschnee01§Zonen_unterhalb","line":2}}},{"curlyName":"Nassschnee09","line":0,"args":{"Nassschnee09§wann_warum":{"curlyName":"Nassschnee09§wann_warum","line":9},"von_Lawinenart":{"curlyName":"von_Lawinenart","line":45},"Nassschnee09§wie_stark":{"curlyName":"Nassschnee09§wie_stark","line":1},"Nassschnee09§wo_Höhe":{"curlyName":"Nassschnee09§wo_Höhe","line":8,"args":{"Höhe_Höhenlage":{"curlyName":"Höhe_Höhenlage","line":5}}}}},{"curlyName":"Auslösung01","line":0,"args":{"es_warum_wo":{"curlyName":"es_warum_wo","line":0},"Zeit_optional1":{"curlyName":"Zeit_optional1","line":1},"Auslösung01§möglich":{"curlyName":"Auslösung01§möglich","line":0},"wieviele":{"curlyName":"wieviele","line":1},"Lawinenart5":{"curlyName":"Lawinenart5","line":45},"Auslösung01§auch_grosse":{"curlyName":"Auslösung01§auch_grosse","line":5}}},{"curlyName":"Gleitschnee01","line":0,"args":{"Gleitschnee01§Zonen_unterhalb":{"curlyName":"Gleitschnee01§Zonen_unterhalb","line":6}}},{"curlyName":"Gefährdung021","line":0,"args":{"Höhe_Gebiet_dann":{"curlyName":"Höhe_Gebiet_dann","line":0},"Verkehrswege":{"curlyName":"Verkehrswege","line":1},"und_Verkehrswege":{"curlyName":"und_Verkehrswege","line":7},"vereinzelt1":{"curlyName":"vereinzelt1","line":0}}},{"curlyName":"Grösse05","line":0,"args":{"Gebiet_auch":{"curlyName":"Gebiet_auch","line":0},"Einzugsgebiet":{"curlyName":"Einzugsgebiet","line":0},"Die_Lawinen":{"curlyName":"Die_Lawinen","line":8},"oft5":{"curlyName":"oft5","line":4},"vorstossen":{"curlyName":"vorstossen","line":2,"args":{"ziemlich":{"curlyName":"ziemlich","line":1},"mehrheitlich":{"curlyName":"mehrheitlich","line":3},"exponierte":{"curlyName":"exponierte","line":1}}}}}]',
      favourable_situation:
        '[{"curlyName":"Nassschnee08","line":0,"args":{"Nassschnee08§Nach_klarer_Nacht":{"curlyName":"Nassschnee08§Nach_klarer_Nacht","line":2},"Nassschnee08§wo":{"curlyName":"Nassschnee08§wo","line":1},"Nassschnee08§recht":{"curlyName":"Nassschnee08§recht","line":1},"Nassschnee08§günstige_Verhältnisse":{"curlyName":"Nassschnee08§günstige_Verhältnisse","line":0},"Nassschnee08§dann_Anstieg.":{"curlyName":"Nassschnee08§dann_Anstieg.","line":0}}},{"curlyName":"Auslösung03","line":0,"args":{"Auslösung03§Trockene_Lawinen_können":{"curlyName":"Auslösung03§Trockene_Lawinen_können","line":0},"oft":{"curlyName":"oft","line":12},"Belastung":{"curlyName":"Belastung","line":11},"Auslösung03§Grösse":{"curlyName":"Auslösung03§Grösse","line":11}}},{"curlyName":"Dies02","line":0,"args":{"Dies2":{"curlyName":"Dies2","line":4},"Hangart1":{"curlyName":"Hangart1","line":25},"Höhenlage3":{"curlyName":"Höhenlage3","line":0},"Dies02§sowie":{"curlyName":"Dies02§sowie","line":1},"Hangart1°1":{"curlyName":"Hangart1°1","line":23},"Höhenlage3°1":{"curlyName":"Höhenlage3°1","line":0}}},{"curlyName":"Auslösung03","line":0,"args":{"Auslösung03§Trockene_Lawinen_können":{"curlyName":"Auslösung03§Trockene_Lawinen_können","line":9},"oft":{"curlyName":"oft","line":7},"Belastung":{"curlyName":"Belastung","line":0},"Auslösung03§Grösse":{"curlyName":"Auslösung03§Grösse","line":0}}}]',
    };

  public snowpackStructureCommentTextcat: Record<
    Exclude<Enums.AvalancheProblem, "cornices" | "no_distinct_problem">,
    string
  > = {
    new_snow:
      '[{"curlyName":"Wetter04","line":0,"args":{"Wetter04§Es_fielen":{"curlyName":"Wetter04§Es_fielen","line":5,"args":{"Bis_wann":{"curlyName":"Bis_wann","line":4}}},"Gebiet0":{"curlyName":"Gebiet0","line":5},"oberhalb_von_Höhe_optional":{"curlyName":"oberhalb_von_Höhe_optional","line":1,"args":{"Höhe_m":{"curlyName":"Höhe_m","line":14}}},"Wetter04§wieviel_Schnee":{"curlyName":"Wetter04§wieviel_Schnee","line":0,"args":{"verbreitet":{"curlyName":"verbreitet","line":0},"Zahl":{"curlyName":"Zahl","line":9}}},"Wetter04§lokal_mehr.":{"curlyName":"Wetter04§lokal_mehr.","line":3,"args":{"Zahl":{"curlyName":"Zahl","line":11}}}}},{"curlyName":"Neuschnee01","line":0,"args":{"Neuschnee01§Der_Neuschnee":{"curlyName":"Neuschnee01§Der_Neuschnee","line":0,"args":{"Er=der_Neuschnee":{"curlyName":"Er=der_Neuschnee","line":0}}},"Eigenschaft_Neuschnee":{"curlyName":"Eigenschaft_Neuschnee","line":4,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":1},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}}}}}},{"curlyName":"Schneedecke07","line":0,"args":{"Beweis":{"curlyName":"Beweis","line":2},"Beweis_optional":{"curlyName":"Beweis_optional","line":6},"bestätigen_bestätigten":{"curlyName":"bestätigen_bestätigten","line":1},"dies_Situation":{"curlyName":"dies_Situation","line":4,"args":{"wo_optional2":{"curlyName":"wo_optional2","line":0},"Gefahr":{"curlyName":"Gefahr","line":0}}}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":3,"args":{"Schichtung_wie3":{"curlyName":"Schichtung_wie3","line":17}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Altschnee06","line":0,"args":{"Schwachschichten":{"curlyName":"Schwachschichten","line":9},"Altschnee06§erfordern_Vorsicht.":{"curlyName":"Altschnee06§erfordern_Vorsicht.","line":3}}},{"curlyName":"Neuschnee01","line":0,"args":{"Neuschnee01§Der_Neuschnee":{"curlyName":"Neuschnee01§Der_Neuschnee","line":0,"args":{"Er=der_Neuschnee":{"curlyName":"Er=der_Neuschnee","line":0}}},"Eigenschaft_Neuschnee":{"curlyName":"Eigenschaft_Neuschnee","line":31,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":0},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":7}}}}}}},{"curlyName":"Doppelpunkt01","line":0,"args":{"Hangart_Höhe3":{"curlyName":"Hangart_Höhe3","line":31,"args":{"vor_allem":{"curlyName":"vor_allem","line":0},"Höhenlage":{"curlyName":"Höhenlage","line":9}}},"Doppelpunkt01§Komma":{"curlyName":"Doppelpunkt01§Komma","line":0},"Hangart_Höhe4":{"curlyName":"Hangart_Höhe4","line":0}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":4,"args":{"Schichtung_wie1":{"curlyName":"Schichtung_wie1","line":13}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Schneedecke02","line":0,"args":{"Schneedecke02§Der_Neuschnee_liegt":{"curlyName":"Schneedecke02§Der_Neuschnee_liegt","line":0},"Schneedecke02§oft2":{"curlyName":"Schneedecke02§oft2","line":1},"Schneedecke02§Untergrund.":{"curlyName":"Schneedecke02§Untergrund.","line":5}}},{"curlyName":"Altschnee05","line":0,"args":{"Altschnee05§zudem_können":{"curlyName":"Altschnee05§zudem_können","line":0,"args":{"zudem_können":{"curlyName":"zudem_können","line":4},"trockene":{"curlyName":"trockene","line":0}}},"Belastung_Hangart":{"curlyName":"Belastung_Hangart","line":2},"Altschnee05§im_Altschnee":{"curlyName":"Altschnee05§im_Altschnee","line":3}}}]',
    wind_slab:
      '[{"curlyName":"Schneedecke05","line":0,"args":{"Temperaturen":{"curlyName":"Temperaturen","line":0},"Komma_und":{"curlyName":"Komma_und","line":0},"Wetterbedingungen":{"curlyName":"Wetterbedingungen","line":0},"und1":{"curlyName":"und1","line":0},"Windrichtung":{"curlyName":"Windrichtung","line":12,"args":{"starkem_schwachem":{"curlyName":"starkem_schwachem","line":9}}},"Konsequenz_Schneedecke":{"curlyName":"Konsequenz_Schneedecke","line":17,"args":{"bis_am_Tag":{"curlyName":"bis_am_Tag","line":0},"frische":{"curlyName":"frische","line":1}}}}},{"curlyName":"Triebschnee09","line":0,"args":{"Triebschnee09§verschiedenen":{"curlyName":"Triebschnee09§verschiedenen","line":1},"wie_gut":{"curlyName":"wie_gut","line":4},"Triebschnee09§miteinander":{"curlyName":"Triebschnee09§miteinander","line":3}}},{"curlyName":"Triebschnee04","line":0,"args":{"Die_Eigenschaft_TSA":{"curlyName":"Die_Eigenschaft_TSA","line":22,"args":{"sie=die_TSA":{"curlyName":"sie=die_TSA","line":0}}},"Triebschnee04§Grösse":{"curlyName":"Triebschnee04§Grösse","line":0},"Triebschnee04§aber_auslösbar":{"curlyName":"Triebschnee04§aber_auslösbar","line":1,"args":{"in_Randbereichen":{"curlyName":"in_Randbereichen","line":2},"und_aber":{"curlyName":"und_aber","line":0}}}}},{"curlyName":"Triebschnee01","line":0,"args":{"Triebschnee_Beschreibung1":{"curlyName":"Triebschnee_Beschreibung1","line":0},"vom_Tag":{"curlyName":"vom_Tag","line":11,"args":{"Anzahl":{"curlyName":"Anzahl","line":1}}},"Eigenschaft_Triebschnee.":{"curlyName":"Eigenschaft_Triebschnee.","line":37,"args":{"an_Expositionen":{"curlyName":"an_Expositionen","line":0},"und_oberhalb_von_Höhe_optional":{"curlyName":"und_oberhalb_von_Höhe_optional","line":3,"args":{"und":{"curlyName":"und","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":7}}}}}}},{"curlyName":"Zudem06","line":0,"args":{"zudem":{"curlyName":"zudem","line":0},"entstehen":{"curlyName":"entstehen","line":1},"wo_TSA_optional":{"curlyName":"wo_TSA_optional","line":3,"args":{"aller_Expositionen":{"curlyName":"aller_Expositionen","line":1},"vor_allem":{"curlyName":"vor_allem","line":0},"und_im_Hochgebirge":{"curlyName":"und_im_Hochgebirge","line":2}}},"Zeit_optional":{"curlyName":"Zeit_optional","line":0},"Triebschnee_Beschreibung2":{"curlyName":"Triebschnee_Beschreibung2","line":22}}},{"curlyName":"Schneedecke07","line":0,"args":{"Beweis":{"curlyName":"Beweis","line":1},"Beweis_optional":{"curlyName":"Beweis_optional","line":6},"bestätigen_bestätigten":{"curlyName":"bestätigen_bestätigten","line":0},"dies_Situation":{"curlyName":"dies_Situation","line":9,"args":{"wo_optional2":{"curlyName":"wo_optional2","line":9,"args":{"vor_allem":{"curlyName":"vor_allem","line":0}}}}}}}]',
    persistent_weak_layers:
      '[{"curlyName":"Schneedecke01","line":0,"args":{"Schneedecke01§Die_Schneedecke":{"curlyName":"Schneedecke01§Die_Schneedecke","line":1},"Schneedecke01§ist":{"curlyName":"Schneedecke01§ist","line":0},"Schneedecke01§wo":{"curlyName":"Schneedecke01§wo","line":8},"Schneedecke01§störanfällig.":{"curlyName":"Schneedecke01§störanfällig.","line":2}}},{"curlyName":"Dies02","line":0,"args":{"Dies2":{"curlyName":"Dies2","line":1},"Hangart1":{"curlyName":"Hangart1","line":3,"args":{"an_steilen":{"curlyName":"an_steilen","line":1}}},"Höhenlage3":{"curlyName":"Höhenlage3","line":1,"args":{"und_vor_allem":{"curlyName":"und_vor_allem","line":0},"Höhe_m":{"curlyName":"Höhe_m","line":16}}},"Dies02§sowie":{"curlyName":"Dies02§sowie","line":0},"Hangart1°1":{"curlyName":"Hangart1°1","line":0},"Höhenlage3°1":{"curlyName":"Höhenlage3°1","line":0}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":6,"args":{"Schichtung_wie1":{"curlyName":"Schichtung_wie1","line":1}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":9,"args":{"Kruste":{"curlyName":"Kruste","line":10}}}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":4,"args":{"Schichtung_wie1":{"curlyName":"Schichtung_wie1","line":13}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Auslösung07","line":0,"args":{"Auslösung07§Fernauslösungen_sind":{"curlyName":"Auslösung07§Fernauslösungen_sind","line":0},"Auslösung07§möglich.":{"curlyName":"Auslösung07§möglich.","line":0}}},{"curlyName":"Schneedecke07","line":0,"args":{"Beweis":{"curlyName":"Beweis","line":1},"Beweis_optional":{"curlyName":"Beweis_optional","line":1},"bestätigen_bestätigten":{"curlyName":"bestätigen_bestätigten","line":0},"dies_Situation":{"curlyName":"dies_Situation","line":7,"args":{"wo_optional2":{"curlyName":"wo_optional2","line":3,"args":{"an_steilen":{"curlyName":"an_steilen","line":1}}}}}}},{"curlyName":"Schneedecke08","line":0,"args":{"Diese_Bedingungen":{"curlyName":"Diese_Bedingungen","line":6},"erlauben_verhindern":{"curlyName":"erlauben_verhindern","line":2},"Zeit_optional":{"curlyName":"Zeit_optional","line":0},"Hangart_Höhe_Gebiet_wie":{"curlyName":"Hangart_Höhe_Gebiet_wie","line":0,"args":{"vor_allem":{"curlyName":"vor_allem","line":1},"an_steilen":{"curlyName":"an_steilen","line":1}}},"wie_Schneedecke":{"curlyName":"wie_Schneedecke","line":1,"args":{"leichte_deutliche":{"curlyName":"leichte_deutliche","line":2},"der_Schneedecke":{"curlyName":"der_Schneedecke","line":1}}}}},{"curlyName":"Zeilenumbruch01","line":0},{"curlyName":"Schneedecke01","line":0,"args":{"Schneedecke01§Die_Schneedecke":{"curlyName":"Schneedecke01§Die_Schneedecke","line":0},"Schneedecke01§ist":{"curlyName":"Schneedecke01§ist","line":0},"Schneedecke01§wo":{"curlyName":"Schneedecke01§wo","line":11,"args":{"Exposition":{"curlyName":"Exposition","line":1},"und_im_Exposition":{"curlyName":"und_im_Exposition","line":8}}},"Schneedecke01§störanfällig.":{"curlyName":"Schneedecke01§störanfällig.","line":2}}}]',
    wet_snow:
      '[{"curlyName":"Schneedecke05","line":0,"args":{"Temperaturen":{"curlyName":"Temperaturen","line":9},"Komma_und":{"curlyName":"Komma_und","line":2},"Wetterbedingungen":{"curlyName":"Wetterbedingungen","line":12},"und1":{"curlyName":"und1","line":0},"Windrichtung":{"curlyName":"Windrichtung","line":0},"Konsequenz_Schneedecke":{"curlyName":"Konsequenz_Schneedecke","line":15,"args":{"bis_am_Tag":{"curlyName":"bis_am_Tag","line":0},"gefährliche":{"curlyName":"gefährliche","line":3}}}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":2,"args":{"Schichtung_wie2":{"curlyName":"Schichtung_wie2","line":13}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Schneedecke04","line":0,"args":{"Wetterbedingungen_wann":{"curlyName":"Wetterbedingungen_wann","line":3,"args":{"führt_führte":{"curlyName":"führt_führte","line":0},"Zeit_optional2":{"curlyName":"Zeit_optional2","line":0}}},"wo_wie":{"curlyName":"wo_wie","line":1,"args":{"Hangart":{"curlyName":"Hangart","line":6}}},"wo_Höhe_Schneedecke":{"curlyName":"wo_Höhe_Schneedecke","line":3,"args":{"Höhe_m":{"curlyName":"Höhe_m","line":20}}},"Entwicklung_Schneedecke":{"curlyName":"Entwicklung_Schneedecke","line":6,"args":{"raschen2":{"curlyName":"raschen2","line":4}}},"Altschnee01§Schneedecke":{"curlyName":"Altschnee01§Schneedecke","line":0},"Schneedecke_wo":{"curlyName":"Schneedecke_wo","line":0}}},{"curlyName":"Schneedecke08","line":0,"args":{"Diese_Bedingungen":{"curlyName":"Diese_Bedingungen","line":0},"erlauben_verhindern":{"curlyName":"erlauben_verhindern","line":8},"Zeit_optional":{"curlyName":"Zeit_optional","line":0},"Hangart_Höhe_Gebiet_wie":{"curlyName":"Hangart_Höhe_Gebiet_wie","line":0},"wie_Schneedecke":{"curlyName":"wie_Schneedecke","line":1,"args":{"leichte_deutliche":{"curlyName":"leichte_deutliche","line":7},"der_Schneedecke":{"curlyName":"der_Schneedecke","line":0}}}}},{"curlyName":"Zeilenumbruch01","line":0},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":20}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":1,"args":{"Kruste":{"curlyName":"Kruste","line":9}}}}},{"curlyName":"Dies02","line":0,"args":{"Dies2":{"curlyName":"Dies2","line":1},"Hangart1":{"curlyName":"Hangart1","line":4,"args":{"an_steilen":{"curlyName":"an_steilen","line":1}}},"Höhenlage3":{"curlyName":"Höhenlage3","line":4,"args":{"und_vor_allem":{"curlyName":"und_vor_allem","line":0},"in_Höhenlage":{"curlyName":"in_Höhenlage","line":9}}},"Dies02§sowie":{"curlyName":"Dies02§sowie","line":0},"Hangart1°1":{"curlyName":"Hangart1°1","line":0},"Höhenlage3°1":{"curlyName":"Höhenlage3°1","line":0}}},{"curlyName":"Nassschnee07","line":0,"args":{"Nassschnee07§wie_gefroren":{"curlyName":"Nassschnee07§wie_gefroren","line":0},"Nassschnee07§und":{"curlyName":"Nassschnee07§und","line":0},"Nassschnee07§weicht_auf.":{"curlyName":"Nassschnee07§weicht_auf.","line":3}}},{"curlyName":"Schneedecke04","line":0,"args":{"Wetterbedingungen_wann":{"curlyName":"Wetterbedingungen_wann","line":8,"args":{"führen_führten":{"curlyName":"führen_führten","line":0},"Zeit7":{"curlyName":"Zeit7","line":1}}},"wo_wie":{"curlyName":"wo_wie","line":1,"args":{"Hangart":{"curlyName":"Hangart","line":3,"args":{"vor_allem":{"curlyName":"vor_allem","line":2},"an_steilen":{"curlyName":"an_steilen","line":2}}}}},"wo_Höhe_Schneedecke":{"curlyName":"wo_Höhe_Schneedecke","line":0},"Schneedecke_wo":{"curlyName":"Schneedecke_wo","line":2},"Entwicklung_Schneedecke":{"curlyName":"Entwicklung_Schneedecke","line":5},"Altschnee01§Schneedecke":{"curlyName":"Altschnee01§Schneedecke","line":0}}}]',
    gliding_snow:
      '[{"curlyName":"Schneedecke05","line":0,"args":{"Temperaturen":{"curlyName":"Temperaturen","line":2},"Komma_und":{"curlyName":"Komma_und","line":2},"Wetterbedingungen":{"curlyName":"Wetterbedingungen","line":12},"und1":{"curlyName":"und1","line":0},"Windrichtung":{"curlyName":"Windrichtung","line":0},"Konsequenz_Schneedecke":{"curlyName":"Konsequenz_Schneedecke","line":14,"args":{"am_Tag":{"curlyName":"am_Tag","line":5,"args":{"Anzahl":{"curlyName":"Anzahl","line":1}}},"gefährliche":{"curlyName":"gefährliche","line":8}}}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":4}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":1,"args":{"Kruste":{"curlyName":"Kruste","line":6}}}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":4,"args":{"Schichtung_wie1":{"curlyName":"Schichtung_wie1","line":20}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":22}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Auslösung05","line":0,"args":{"Auslösung05§Es":{"curlyName":"Auslösung05§Es","line":0},"Hangart_Höhe_Gebiet_optional2":{"curlyName":"Hangart_Höhe_Gebiet_optional2","line":6,"args":{"an_Böschungen":{"curlyName":"an_Böschungen","line":3}}},"wieviele3":{"curlyName":"wieviele3","line":1},"Grösse_der_Lawinen":{"curlyName":"Grösse_der_Lawinen","line":2},"Auslösung05§spontan":{"curlyName":"Auslösung05§spontan","line":1},"Auslösung05§Einzugsgebiet.":{"curlyName":"Auslösung05§Einzugsgebiet.","line":0}}},{"curlyName":"Gleitschnee01","line":0,"args":{"Gleitschnee01§Zonen_unterhalb":{"curlyName":"Gleitschnee01§Zonen_unterhalb","line":3}}},{"curlyName":"Schneedecke08","line":0,"args":{"Diese_Bedingungen":{"curlyName":"Diese_Bedingungen","line":2},"erlauben_verhindern":{"curlyName":"erlauben_verhindern","line":4},"Zeit_optional":{"curlyName":"Zeit_optional","line":0},"Hangart_Höhe_Gebiet_wie":{"curlyName":"Hangart_Höhe_Gebiet_wie","line":0},"wie_Schneedecke":{"curlyName":"wie_Schneedecke","line":6,"args":{"leichte_deutliche":{"curlyName":"leichte_deutliche","line":2},"der_Schneedecke":{"curlyName":"der_Schneedecke","line":2}}}}}]',
    favourable_situation:
      '[{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":8}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":0}}},{"curlyName":"Zeilenumbruch01","line":0},{"curlyName":"Doppelpunkt01","line":0,"args":{"Hangart_Höhe3":{"curlyName":"Hangart_Höhe3","line":2,"args":{"vor_allem":{"curlyName":"vor_allem","line":0},"steile":{"curlyName":"steile","line":1}}},"Hangart_Höhe4":{"curlyName":"Hangart_Höhe4","line":30,"args":{"Höhenlage":{"curlyName":"Höhenlage","line":9}}},"Doppelpunkt01§Komma":{"curlyName":"Doppelpunkt01§Komma","line":0}}},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":4}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":3}}},{"curlyName":"Auslösung04","line":0,"args":{"Wintersportler":{"curlyName":"Wintersportler","line":3,"args":{"einzelne2":{"curlyName":"einzelne2","line":1}}},"vereinzelt":{"curlyName":"vereinzelt","line":9},"Auslösung04§auch_grosse.":{"curlyName":"Auslösung04§auch_grosse.","line":0}}},{"curlyName":"Zeilenumbruch01","line":0},{"curlyName":"Schneedecke03","line":0,"args":{"Schneedecke_Sie":{"curlyName":"Schneedecke_Sie","line":0,"args":{"Schichtung_wie":{"curlyName":"Schichtung_wie","line":8}}},"Oberfläche_wie":{"curlyName":"Oberfläche_wie","line":1,"args":{"Kruste":{"curlyName":"Kruste","line":3}}}}},{"curlyName":"Dies02","line":0,"args":{"Dies2":{"curlyName":"Dies2","line":1},"Hangart1":{"curlyName":"Hangart1","line":4,"args":{"an_steilen":{"curlyName":"an_steilen","line":1}}},"Höhenlage3":{"curlyName":"Höhenlage3","line":0},"Dies02§sowie":{"curlyName":"Dies02§sowie","line":0},"Hangart1°1":{"curlyName":"Hangart1°1","line":0},"Höhenlage3°1":{"curlyName":"Höhenlage3°1","line":0}}},{"curlyName":"Nassschnee07","line":0,"args":{"Nassschnee07§wie_gefroren":{"curlyName":"Nassschnee07§wie_gefroren","line":0},"Nassschnee07§und":{"curlyName":"Nassschnee07§und","line":1},"Nassschnee07§weicht_auf.":{"curlyName":"Nassschnee07§weicht_auf.","line":4}}},{"curlyName":"Zeilenumbruch01","line":0},{"curlyName":"Grösse08","line":0,"args":{"Grösse08§wo":{"curlyName":"Grösse08§wo","line":2,"args":{"in_Höhenlage":{"curlyName":"in_Höhenlage","line":1},"Grösse08§Schnee_zum_mitreissen":{"curlyName":"Grösse08§Schnee_zum_mitreissen","line":1}}}}}]',
  };

  constructor() {}

  getDangerRatingColor(dangerRating: Enums.DangerRating) {
    switch (dangerRating) {
      case Enums.DangerRating.very_high:
        return this.colorDangerRatingVeryHigh;
      case Enums.DangerRating.high:
        return this.colorDangerRatingHigh;
      case Enums.DangerRating.considerable:
        return this.colorDangerRatingConsiderable;
      case Enums.DangerRating.moderate:
        return this.colorDangerRatingModerate;
      case Enums.DangerRating.low:
        return this.colorDangerRatingLow;
      case Enums.DangerRating.no_snow:
        return this.colorDangerRatingNoSnow;

      default:
        return this.colorDangerRatingMissing;
    }
  }

  getDangerRatingColorBw(dangerRating: Enums.DangerRating) {
    switch (dangerRating) {
      case Enums.DangerRating.very_high:
        return this.colorDangerRatingVeryHighBw;
      case Enums.DangerRating.high:
        return this.colorDangerRatingHighBw;
      case Enums.DangerRating.considerable:
        return this.colorDangerRatingConsiderableBw;
      case Enums.DangerRating.moderate:
        return this.colorDangerRatingModerateBw;
      case Enums.DangerRating.low:
        return this.colorDangerRatingLowBw;
      case Enums.DangerRating.no_snow:
        return this.colorDangerRatingNoSnow;

      default:
        return this.colorDangerRatingMissing;
    }
  }

  getServerUrl() {
    return environment.apiBaseUrl;
  }

  getWsBulletinUrl() {
    return environment.wsBaseUrl + "bulletin/";
  }

  getWsUpdateUrl() {
    return environment.wsBaseUrl + "update/";
  }

  getISOStringWithTimezoneOffsetUrlEncoded(date: Date) {
    return encodeURIComponent(this.getISOStringWithTimezoneOffset(date));
  }

  getISOStringWithTimezoneOffset(date: Date) {
    const offset = -date.getTimezoneOffset();
    const dif = offset >= 0 ? "+" : "-";

    return (
      date.getFullYear() +
      "-" +
      this.extend(date.getMonth() + 1) +
      "-" +
      this.extend(date.getDate()) +
      "T" +
      this.extend(date.getHours()) +
      ":" +
      this.extend(date.getMinutes()) +
      ":" +
      this.extend(date.getSeconds()) +
      dif +
      this.extend(offset / 60) +
      ":" +
      this.extend(offset % 60)
    );
  }

  getISODateString(date: Date) {
    return date.getFullYear() + "-" + this.extend(date.getMonth() + 1) + "-" + this.extend(date.getDate());
  }

  extend(num: number) {
    const norm = Math.abs(Math.floor(num));
    return (norm < 10 ? "0" : "") + norm;
  }
}
