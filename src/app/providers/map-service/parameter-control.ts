import L from "leaflet";

export const ParameterControl = L.Control.extend({
  options: {
    key: "",
    backgroundColor: "#FFF",
    active: false,
    tooltip: "",
    icon: "",
  },

  onAdd() {
    var link = L.DomUtil.create("a", "leaflet-bar leaflet-control leaflet-control-custom");
    var div = L.DomUtil.create("div", "leaflet-bar parameter-control", link);
    div.title = this.options.tooltip;
    var myButton = L.DomUtil.create("button", "", div);
    let myImage = L.DomUtil.create("i", "my-button-class", myButton);
    myImage.innerHTML = this.options.icon;
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.on(div, "click", function () {
      console.log(this.options.key);
    });

    return div;

    const container = L.DomUtil.create("a", "leaflet-bar leaflet-control leaflet-control-custom");
    container.style.backgroundColor = "white";
    container.style.width = "35px";
    container.style.height = "35px";
    const button = L.DomUtil.create(
      "button",
      `<button style="background-color: ${this.options.backgroundColor}; width: -webkit-fill-available; height: -webkit-fill-available; border: none; border-radius: inherit;">${this.options.icon}</button>`,
    );
    container.innerHTML;
    container.title = this.options.tooltip;
    return container;
  },

  setKey(key: string) {
    this.options.key = key;
    this.setOptions();
    return this;
  },

  setOptions() {
    switch (this.options.key) {
      case "globalRadiation":
        this.options.icon = '<i class="ph ph-sun"></i>';
        this.options.tooltip = "Global radiation";
        return this;
      case "snowHeight":
        this.options.icon = '<i class="ph ph-arrows-vertical"></i>';
        this.options.tooltip = "Snow height";
        return this;
      case "snowDifference24h":
        this.options.icon = '<i class="ph ph-arrows-vertical"></i>';
        this.options.tooltip = "Snow height difference 24h";
        return this;
      case "snowDifference48h":
        this.options.icon = '<i class="ph ph-arrows-vertical"></i>';
        this.options.tooltip = "Snow height difference 48h";
        return this;
      case "snowDifference72h":
        this.options.icon = '<i class="ph ph-arrows-vertical"></i>';
        this.options.tooltip = "Snow height difference 72h";
        return this;
      case "airTemperature":
        this.options.icon = '<i class="ph ph-thermometer-simple"></i>';
        this.options.tooltip = "Air temperature";
        return this;
      case "airTemperatureMax":
        this.options.icon = '<i class="ph ph-thermometer-simple"></i>';
        this.options.tooltip = "Max. air temperature within 24h";
        return this;
      case "airTemperatureMin":
        this.options.icon = '<i class="ph ph-thermometer-simple"></i>';
        this.options.tooltip = "Min. air temperature within 24h";
        return this;
      case "surfaceTemperature":
        this.options.icon = '<i class="ph ph-thermometer-cold"></i>';
        this.options.tooltip = "Surface temperature";
        return this;
      case "dewPoint":
        this.options.icon = '<i class="ph ph-thermometer-hot"></i>';
        this.options.tooltip = "Dew point temperature";
        return this;
      default:
        this.options.icon = "";
        this.options.tooltip = "";
        return this;
    }
  },

  onRemove() {
    // Nothing to do here
  },
});
