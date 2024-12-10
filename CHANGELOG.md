# Changelog

<!-- Update using `yarn changelog <TAG>` before creating new tag <TAG> with git. -->

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
