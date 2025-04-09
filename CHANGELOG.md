# Changelog

<!-- Update using `yarn changelog <TAG>` before creating new tag <TAG> with git. -->

## [7.1.11] - 2025-04-09

### ⚙️ Miscellaneous Tasks

- Update to echarts 5.6.0
- Sort list of users alphabetically by name

### Bulletins

- Check bulletins for complete translations
- Allow to publish all regions without messages (admin)

### Observations

- Calc surface hoar probability for weather stations
- Add shortcuts to navigate through time for webcams
- Show smaller thumbnails of webcams, adopt to screen width
- Detect changes in daterange
- Improve color and label for relative humidity
- Add shortcuts for observations page
- Toggle filter sidebar with button in map
- Add button to show/hide sidebar in menu
- Move download buttons in dropdown menu
- Apply filter only to observations
- Style search field

### Danger Sources

- Add danger source to filter on observation page if danger sources are enabled for the region
- Create avActivityComment texts from danger source variants
- Expand and improve danger source variant parameters

## [7.1.10] - 2025-03-18

### 🐛 Bug Fixes

- Fix typo in method to check avalanche problems for completeness

### ⚙️ Miscellaneous Tasks

- Update to angular 19.2.1
- Update eaws-regions to v7.0.7

### Bulletins

- Allow to delete all bulletins of one day at once

### Observations

- Add filter for danger sources
- Allow to connect observation to danger source
- Allow to show old plots for dry snowfall level with arrow keys

### Danger Sources

- Add statistics download
- Improve visualization of variants in list view
- Add keyboard shortcuts
- Create bulletins from danger sources
- Show danger ratings on AM and PM map

## [7.1.9] - 2025-03-03

### Bulletins

- Fix load from yesterday when a cross-border region is present

### AWSOME Dashboard

- Image overlays
- Parse awsome.config using zod

### Observations

- Improve Dry snowfall level as weather-station parameter
- Dialog: make report date not mandatory

### 🐛 Bug Fixes

### Danger Sources

- Add aspects and avalanche problem to list view
- Add average snow height for gliding snow
- Add danger sign fresh avalanches
- Add enum for crusts
- Add surface hoar formation process
- Add terrain types
- Align buttons for terrain features
- Count only analyzed variants if analysis is available

## [7.1.8] - 2025-02-17

### Observations

- Dry snowfall level as weather-station parameter (max between startDate and endDate)

### 🐛 Bug Fixes

- Add X-Client-Version header to HTTP requests (only for our server; fixes CORS problems for external servers)

## [7.1.7] - 2025-02-17

### Bulletins

- Show if danger rating was overridden

### Observations

- Add DrySnowfallLevel as observation type
- Show calculated DrySnowfallLevel as weather stations parameter

### 🐛 Bug Fixes

- Set correct status for bulletins
- Fix HTTP 415 error while upload of media file

### 🚜 Refactor

- Replace ngx-slider with range
- Add X-Client-Version header to HTTP requests

## [7.1.6] - 2025-02-10

### 🚀 Features

- Sync accordion for compared bulletins
- Add Klausberg webcams via it-wms.com
- Document deployment of observation-api
- Add server config for elevation dependent danger level

### 🐛 Bug Fixes

- Do not show loading error for HTTP 304 not modified
- Set correct status and publication infos text
- Unsubscribe from pending requests

### ⚙️ Miscellaneous Tasks

- Update to Astro 5.1.5
- Update eaws-regions to v7.0.6
- Update to angular 19.1.3
- Update ngx-slider to v19

## [7.1.5] - 2025-01-09

### 🐛 Bug Fixes

- Remove css before and after for global-bar-scroll

## [7.1.4] - 2025-01-08

### Observations

- Allow to edit/augment any observation
- Add category forBlog to observations
- Implement weather station aggregation
- Export filtered observations

### Forecasts

- Add weather map image overlays

### 🐛 Bug Fixes

- Observation charts on mobile

### ⚙️ Miscellaneous Tasks

- Update to leaflet-control-geocoder 3.0.1

## [7.1.3] - 2024-12-17

### Bulletins

- Change region by clicking on the region name in the overview table
- Fix a bug where audio files could not be uploaded from mobile devices (file type filter)
- Switch previous/next date buttons in the editing view for bulletins

## [7.1.2] - 2024-12-16

### Observations

- The search field is now displayed in the toolbar for both the table and map view.
- externalURL as editable component for observations
- Bugfix: Lola-kronos stability test category
- Bugfix: Display observations where region is absent

### Stress Level

- Show stress level graph only for members of the same region

### Keyboard Shortcuts

- Improve keyboard shortcuts for bulletins and add shortcut creating new observations

### Miscellaneous

- Update to ngx-bootstrap 19.0.0
- Update eaws-regions to v7.0.5

## [7.1.1] - 2024-12-10

### Bulletins

- Simplify save operation for dangerPattern
- LoadExternalBulletins according to latest validity.
  This allows bulletins from e.g. AINEVA to be correctly loaded, even though they do not use the 5pm validity.

### Observations

- Categorize new observations as 'Avalanche' based on PersonInvolvement
- Automatically parse Leitstelle Tirol codes for PersonInvolvement

## [7.1.0] - 2024-12-08

### Bulletins

- Load additional regions (AT-02,..., AT-06, AT-08, DE-BY) and display them on the map.

### Observations

- Rain boundary for LO.LA Kronos observations.
- Elevation for observations can be given as range. The filter functionality includes all observations with ranges that contain that elevation.
- Improve filtering by allowing simple clicks to unset filters.
- The date picker for filtering elevations now allows setting the time as well.

### Keyboard Shortcuts

- Keyboard shortcuts for navbar entries and bulletins. Available shortcuts are shown on on mouseover. An overview can be found [here](https://gitlab.com/albina-euregio/albina-admin-gui/-/issues/356).

### Documentation

- Comprehensive CHANGELOG.

## [7.0.3] - 2024-11-24

### Observations

- Observation Editor: Copy the event date to report date via button click.

### Miscellaneous

- Keyboard shortcuts for navigating the NavBar: #356

## [7.0.2] - 2024-11-18

### Observations

- Observation Editor: Fix date input on all browsers.

## [7.0.1] - 2024-11-14

### Observations

- Bugfix for filtering of observations that have been newly created using the Observation Editor.

## [7.0.0] - 2024-11-08

### Breaking Changes

- Bulletins are now valid from 5pm until 5pm.

### Bulletins

Completely redesigned UI for creating and editing bulletins. We now use Bootstrap 5 and Phosphor Icons
throughout the user interface.
Other notable features:

- Automatically synchronize bulletins with server (no need to click save).
- Ability to undo/redo actions using Ctrl+Z Ctrl+Y or buttons.
- Add read only mode for bulletins.
- Show validation warnings per bulletin
- Add Strategic Mindset per region (intended to express mental attitude with regard to the avalanche situation).
- Add avalanche type (Slab, Loose, Glide) per avalanche problem.
- Ability to compare bulletins side by side.
- Enable notes for all roles (except observer).

### Stress Level

Option to track stress level of the individual users via the bulletin calendar view.
Supported features:

- Can be enabled/disabled for each region via the Admin settings.
- The stress level is selected on a slider between 0 and 100.
- Forecasters can view an anonymized line chart comparing stress levels in their team.

### Training Mode

In Training Mode you can create and edit bulletins without them being synchronized to the server.
Training Mode is always linked to a specific date in the past. This is the simulated date, up to which
you can use the resources (observations, bulletin from the day before) supplied by the admin gui.
As the name suggests this is intended for training purposes, where you can let multiple users
train on the same simulation date and then compare and discuss the resulting bulletins.
Specifically, the following features are supported:

- Configure the training timestamp in Settings.
- The color of the Navbar distinguishes between training mode (green) and normal mode (yellow). The training timestamp is also displayed in the Navbar.
- When using "Load bulletin from the day before" the actual published bulletin from the selected date is loaded from the server.
- Observations are only loaded and displayed up until the date provided in the training timestamp.
- Training Mode can be used in all roles (also Observer).
- Bulletins are saved only in local storage and can be exported as PDF and JSON.

### Danger Sources

This feature proposes a stronger integration of the hazard assessment process into the workflow of public avalanche forecasters. By using danger sources the focus lies no longer solely on the creation of a (daily) bulletin for communication, but rather on the temporal and spatial tracking, documentation and assessment of hazard sources and its variants. This makes the forecasting process more consistent and comprehensible. It provides a more profound basis for communication and discussion between forecasters and neighboring AWS’, enables better transitions during shift changes and prevents information loss. At the same time, uncertainties in the assessment process can be better identified and addressed (see https://arc.lib.montana.edu/snow-science/item/2896). The current implementation allows to track danger sources and their variants. There is no automatic suggestion of the bulletin yet.

- Enable users to forecast danger sources and validate the forecast on the next day
- Allow to compare analyzed danger source variants with forecast
- Sort danger sources by creation date
- Sort danger source variants by danger rating
- Show highest danger rating for each micro-region resulting from any danger source as color in map
- Add status (active, dormant, inactive) to danger source variants

### Observations

- Analyze (histogram) and colorize, label (map) and filter based on the following properties:
  - Aspect, Day, Elevation, Stability, Observation Type, Important, Avalanche Problem, Danger Pattern
- Implement observations API in Astro. This fetches observations from multiple sources and stores them in the MySQL database.
  This results in faster loading times.
- Weather stations can be integrated into Observations dashboard. Parameters can be selected, measurements are shown on the map.
  Clicking a marker opens a dialog with detailed charts. Surface hoar and snow line can be calculated from measurements and displayed as well.
- Observation Editor: Use new data model. Now it supports the following additional fields:
  - aspects, stability, elevationLowerBound, elevationUpperBound, avalancheProblems, dangerPatterns, importantObservations, personInvolvement

### AWSOME Dashboard

Add highly configurable dashboard for the [AWSOME project](https://gitlab.com/avalanche-warning).
It is modeled after the existing Observations Dashboard.

- Configuration is managed via a JSON file which defines multiple sources to be loaded.
  A different configuration can be set by specifying a URL parameter.
- Features for a specified timeframe are displayed on a map.
- After clicking on a feature, details are shown in the sidebar.
- Custom filter options to analyze the displayed features can be configured.

### Settings

- Allow user to update own infos, image and password
