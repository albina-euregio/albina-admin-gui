# Changelog

<!-- To update, run `yarn changelog`. -->

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

- _(danger-sources)_ Add to menu, add to config
- _(danger-sources)_ Add menu entry, controller, service, model (incomplete)
- _(danger-source)_ Add generic map object
- _(danger-sources)_ Add danger source schema (incomplete)
- _(danger-sources)_ Simplify service
- _(danger-sources)_ DefaultParams
- _(danger-sources)_ Use URLSearchParams
- _(danger-sources)_ Add return type to generic map object
- _(danger-sources)_ Implement view (incomplete)
- _(danger-sources)_ Extend danger source logic
- _(danger-sources)_ Implement save/load for danger sources and variants
- _(danger-sources)_ Add shared module, fix load from yesterday
- _(danger-sources)_ Set active variant after create
- _(danger-sources)_ Extend danger source variant component
- _(danger-sources)_ Add glidingSnowActivityValue, rename status to dangerSourceVariantStatus
- _(danger-sources)_ Add parameter to danger source variant view
- _(danger-sources)_ Update i18n strings
- _(danger-sources)_ Add parameter to view, update i18n strings
- _(danger-sources)_ Add properties to variant gui
- _(danger-sources)_ Add infos to headers, edit danger source modal
- _(danger-sources)_ Update status texts
- _(danger-sources)_ Update danger source method
- _(danger-sources)_ Disable compared variant
- _(danger-sources)_ Create internal danger source and variants at once
- _(danger-sources)_ Sort variants by danger rating
- _(danger-sources)_ Add danger source title to variant header
- _(danger-sources)_ Add status and make it editable
- _(danger-sources)_ Sort variants to update map correctly
- _(danger-sources)_ Show status of variant and make it editable
- _(danger-sources)_ Add danger source variant type, load status
- _(danger-sources)_ Add forecast/analysis differentiation
- _(danger-sources)_ Show type below date in create danger sources view
- _(danger-sources)_ Compare forecast with analysis
- _(danger-sources)_ Put label in own row
- _(danger-sources)_ Use checkboxes for all parameter
- _(danger-sources)_ Use full width for slab hand hardness

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
