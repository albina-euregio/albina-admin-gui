import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-linea-export",
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: "./lineaexport.component.html",
  styleUrls: ["./lineaexport.component.css"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LineaExportComponent {
  // All station IDs
  stationIds: string[] = [
    "ABIR1","ABRA2","ACOM1","AKLE1","AKLE2","ARAU1","ARAU2","AXLIZ1","AXLIZ3",
    "BJOE1","BJOE2","EERF1","EERF2","FHOC1","FHOC2","FISS1","FISS2",
    "FSEE1","FSEE2","FSON1","FSON2","FURG2","GADA2","GAMA1","GAMA2",
    "GGAL1","GGAL2","GJAA1","GJAM1","GJAM2","GPRE1","GPRE2","HHAH1",
    "IMOS1","IMOS2","IMUT1","IMUT2","INAC1","INAC2","IPIS1","IPIS2",
    "ISEE1","ISEE2","ISEE3","KABD1","KADL1","KAUN1","KAUN2",
    "KDIA1","KDIA2","KFIG1","KFIG2","KGRI2","KGRO1","KHOR1","KHOR2",
    "KSIN1","KSIN2","KSPI2","KTRI1","KUET1","KWEL2","KZWO1",
    "LBRE1","LBRE2","LGRU1","LGRU2","LPUI1","LPUI2",
    "MIOG1","MIOG2","MIOH1","MIOH2",
    "NASS1","NASS2","NELF1","NELF2","NFRA1","NFRA2",
    "NGAM1","NGAM2","NGAN2","NNOW1","NSCH1","NSGE2",
    "NSGR1","NSGS1","NVAL1","NVAL2",
    "OCON1","PESE1","PESE2","RHAN2",
    "SAAU1","SAAU2","SAGA1","SAGA2","SARE1","SARE2",
    "SAUL2","SAYO1","SBAR2",
    "SDAW1","SDAW2","SFES1","SFES2",
    "SGIG2","SKAP1","SKAP2","SKRE1",
    "SLAG1","SLBU1","SLBU2",
    "SLRI1","SLRI2","SLSE1",
    "SMAS1","SMAS2","SMED1","SMED2",
    "SPLO1","SPLO2",
    "SRET1","SRET2","SROS1",
    "SSLA1","SSLA2","SSON1","SSON2","SSPE2",
    "STHU1","SVVO1","SVVO2",
    "SVZI1","SVZI2",
    "THOH1","TLAE1","TLAE2",
    "TODO","TODO2",
    "TRAU1","TRAU2",
    "TTUX1","TTUX2",
    "TWAN1","TWAN2",
    "ZSIL1","ZSIL2"
  ];

  // Initially selected station
  selectedIds: string[] = ["AXLIZ1"];

  // Add a station
  addStation(id: string): void {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
    }
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter(s => s !== id);
  }

  // linea-plot srcs
  get srcs(): string {
    return JSON.stringify(
      this.selectedIds.map(
        (id) => `https://api.avalanche.report/lawine/grafiken/smet/woche/${id}.smet.gz`
      )
    );
  }

  // linea-plot lazysrcs
  get lazysrcs(): string {
    return JSON.stringify(
      this.selectedIds.map(
        (id) => `https://api.avalanche.report/lawine/grafiken/smet/winter/${id}.smet.gz`
      )
    );
  }
}
