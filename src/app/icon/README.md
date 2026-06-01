# Weather Forecast Viewer (ICON/GFS)

The `IconComponent` provides a comprehensive interface for displaying weather forecast model visualizations, supporting both the **ICON** and **GFS** models.

It fetches and overlays meteorological chart images for different regions, parameters, pressure levels, and forecast run-times.

## Key Features

- **Model Selection**: Switch between **ICON** (regional) and **GFS** (global) forecast models.
- **Dynamic Timeline**: Browse forecast timesteps grouped by date. Automatically handles time zone conversion to the user's local timezone.
- **Regions Support**: Filter charts by EUREGIO, Alps, Europe, and Atlantic depending on the model's capabilities.
- **Meteorological Parameters**: View various parameters such as:
  - _ICON_: Cloud Cover (`cc`), and custom parameters loaded dynamically from `Parameter.txt`.
  - _GFS_: Equivalent Potential Temperature (`et`), Relative Humidity (`r`), Geopotential and Isotachs (`g`), Precipitation (`ns`), and CAPE (`cape`).
- **Atmospheric Levels**: Select standard pressure levels (300 hPa to 925 hPa) or Surface level options.
- **Touch Navigation**: Swipe left or right on the main chart area to navigate chronologically through the forecast timeline.

## Keyboard Shortcuts

To make navigation faster for forecasters, the component includes several global keyboard shortcuts:

| Shortcut                                                    | Action                                     |
| :---------------------------------------------------------- | :----------------------------------------- |
| <kbd>M</kbd>                                                | Toggle forecast model (ICON / GFS)         |
| <kbd>R</kbd>                                                | Toggle map region                          |
| <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd>                   | Navigate between meteorological parameters |
| <kbd>Ctrl</kbd> + <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> | Change atmospheric levels (hPa)            |
| <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>                | Step backward or forward in the timeline   |

## Data Sources

1. **ICON Model**:
   - Parameters loaded from: `https://extra.avalanche.report/meteo-bz/meteo-bz/Parameter.txt`
   - Image Directory: `https://extra.avalanche.report/meteo-bz/meteo-bz/`
2. **GFS Model**:
   - PNG images loaded from the University of Innsbruck (ertel2): `https://ertel2.uibk.ac.at/ertel/data/pngs/GFS`
   - Dynamic run detection probes recent timestamps to automatically find the latest available forecast run (`00`, `06`, `12`, or `18`).
