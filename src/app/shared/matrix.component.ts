import { Component, inject, input, model, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BulletinModel } from "app/models/bulletin.model";

import * as Enums from "../enums/enums";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { ConstantsService } from "../providers/constants-service/constants.service";

interface MatrixCell {
  dangerRating: Enums.DangerRating;
  avalancheSize: Enums.AvalancheSize;
  snowpackStability: Enums.SnowpackStability;
  frequency: Enums.Frequency;
}

@Component({
  selector: "app-matrix",
  templateUrl: "matrix.component.html",
  styleUrls: ["matrix.component.scss"],
  standalone: true,
  imports: [TranslateModule],
})
export class MatrixComponent {
  constantsService = inject(ConstantsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly dangerRating = output<Enums.DangerRating>();
  readonly snowpackStability = model<Enums.SnowpackStability>(undefined);
  readonly frequency = model<Enums.Frequency>(undefined);
  readonly avalancheSize = model<Enums.AvalancheSize>(undefined);
  readonly disabled = input<boolean>(undefined);

  readonly CELLS: MatrixCell[] = [
    undefined,
    {
      dangerRating: Enums.DangerRating.very_high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.very_high,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.very_high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.very_poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.very_high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.poor,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.high,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.many,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.some,
    },
    {
      dangerRating: Enums.DangerRating.considerable,
      avalancheSize: Enums.AvalancheSize.extreme,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.very_large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.moderate,
      avalancheSize: Enums.AvalancheSize.large,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.medium,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.fair,
      frequency: Enums.Frequency.few,
    },
    {
      dangerRating: Enums.DangerRating.low,
      avalancheSize: Enums.AvalancheSize.small,
      snowpackStability: Enums.SnowpackStability.good,
      frequency: Enums.Frequency.none,
    },
  ];

  isActive({ avalancheSize, snowpackStability, frequency }: MatrixCell): boolean {
    return (
      this.avalancheSize() === avalancheSize &&
      this.snowpackStability() === snowpackStability &&
      this.frequency() === frequency
    );
  }

  selectCell({ dangerRating, avalancheSize, snowpackStability, frequency }: MatrixCell) {
    if (this.disabled()) {
      return;
    }
    this.dangerRating.emit(dangerRating);
    this.avalancheSize.set(avalancheSize);
    this.snowpackStability.set(snowpackStability);
    this.frequency.set(frequency);
  }

  getColor(cell: MatrixCell): string {
    if (!cell.dangerRating) {
      return "#FFFFFF";
    }
    return this.isActive(cell)
      ? this.constantsService.getDangerRatingColor(cell.dangerRating)
      : this.constantsService.getDangerRatingColorBw(cell.dangerRating);
  }
}
