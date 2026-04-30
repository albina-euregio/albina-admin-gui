import { CommonModule } from "@angular/common";
import { Component, HostListener, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

interface IconParameter {
  code: string;
  description: string;
}

interface IconFile {
  fileName: string;
  timestamp: string;
}

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./icon.component.html",
  styleUrls: ["./icon.component.css"],
})
export class IconComponent implements OnInit {
  private readonly baseUrl = "https://extra.avalanche.report/meteo-bz/meteo-bz/";
  private readonly parameterUrl = `${this.baseUrl}Parameter.txt`;

  parameters: IconParameter[] = [];
  selectedIndex = 0;
  selectedImageUrl = "";
  selectedImageTimestamp = "";

  loading = true;
  error = "";

  private filesByParameter: Record<string, IconFile> = {};

  async ngOnInit() {
    await this.loadData();
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent) {
    if (!this.parameters.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectParameterByIndex(this.selectedIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectParameterByIndex(this.selectedIndex - 1);
    }
  }

  selectParameterByIndex(index: number) {
    const parameterCount = this.parameters.length;
    if (!parameterCount) {
      return;
    }

    this.selectedIndex = (index + parameterCount) % parameterCount;
    this.updateSelectedImage();
  }

  private async loadData() {
    this.loading = true;
    this.error = "";

    try {
      const [parameterText, directoryIndex] = await Promise.all([
        fetch(this.parameterUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load parameters (${response.status})`);
          }
          return response.text();
        }),
        fetch(this.baseUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load image index (${response.status})`);
          }
          return response.text();
        }),
      ]);

      this.parameters = this.parseParameters(parameterText);
      this.filesByParameter = this.parseLatestFilesByParameter(directoryIndex);

      if (!this.parameters.length) {
        this.error = "No ICON parameters available.";
        return;
      }

      this.updateSelectedImage();
    } catch {
      this.error = "Could not load ICON data.";
    } finally {
      this.loading = false;
    }
  }

  private updateSelectedImage() {
    const selectedParameter = this.parameters[this.selectedIndex];
    const iconFile = selectedParameter ? this.filesByParameter[selectedParameter.code] : undefined;

    this.selectedImageUrl = iconFile ? `${this.baseUrl}${iconFile.fileName}` : "";
    this.selectedImageTimestamp = iconFile?.timestamp ?? "";
  }

  private parseParameters(parameterText: string): IconParameter[] {
    return parameterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("name"))
      .map((line) => {
        const match = line.match(/^([a-z0-9]+)\s+(.+)$/i);
        if (!match) {
          return undefined;
        }
        return {
          code: match[1],
          description: match[2].trim(),
        };
      })
      .filter((parameter): parameter is IconParameter => parameter !== undefined);
  }

  private parseLatestFilesByParameter(directoryIndexHtml: string): Record<string, IconFile> {
    const result: Record<string, IconFile> = {};
    const regex = /href="\.\/(ICON-1E_(\d{8})_(\d{2})_([a-z0-9]+)al\.png)"/gi;

    for (const match of directoryIndexHtml.matchAll(regex)) {
      const fileName = match[1];
      const timestamp = `${match[2]}${match[3]}`;
      const parameterCode = match[4];
      const existing = result[parameterCode];

      if (!existing || timestamp > existing.timestamp) {
        result[parameterCode] = {
          fileName,
          timestamp,
        };
      }
    }

    return result;
  }

  formatTimestamp(timestamp: string): string {
    if (timestamp.length !== 10) {
      return "";
    }

    const year = timestamp.slice(0, 4);
    const month = timestamp.slice(4, 6);
    const day = timestamp.slice(6, 8);
    const hour = timestamp.slice(8, 10);

    return `${year}-${month}-${day} ${hour}:00 UTC`;
  }
}
