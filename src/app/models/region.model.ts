export class RegionModel {
  public id: string;
  public name: string;
  public parentRegion: string;
  public aggregatedRegion: string;

  static createFromJson(json) {
    const region = new RegionModel();
    region.id = json.properties.id;
    region.name = json.properties.name;
    region.parentRegion = json.properties.parentRegion;
    region.aggregatedRegion = json.properties.aggregatedRegion;
    return region;
  }

  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.parentRegion = undefined;
    this.aggregatedRegion = undefined;
  }
}
