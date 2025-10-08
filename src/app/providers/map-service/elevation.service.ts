import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface Request {
  Koordinate: string;
  CRS: string;
  name: "hoehenservice";
}

interface Response {
  abfragestatus: "erfolgreich" | "Die Abfrage-Koordinaten befinden sich nicht in Österreich.";
  abfragekoordinaten: {
    rechtswert: number;
    hochwert: number;
    CRS: number;
  };
  hoeheDTM: number;
  hoeheDSM: number;
  einheit: string;
  datengrundlage: string;
  flugjahr: string;
  voibos: string;
}

@Injectable()
export class ElevationService {
  private http = inject(HttpClient);

  private readonly url = "https://voibos.rechenraum.com/voibos/voibos";

  getElevation(lat: number, lng: number): Observable<number> {
    const params: Request & Record<string, string> = {
      Koordinate: `${lng},${lat}`,
      CRS: "4326",
      name: "hoehenservice",
    };

    return this.http.get<Response>(this.url, { params }).pipe(
      map((res: Response) => {
        if (res.abfragestatus !== "erfolgreich") return;

        const elevation = Math.round(res.hoeheDTM);
        return elevation;
      }),
    );
  }
}
