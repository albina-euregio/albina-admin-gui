# Changelog - Automatically Generated Section

All notable changes to this project will be documented in this file.

## [unreleased]

### 🚜 Refactor

- @angular/core:signals
- @angular/core:signals
- @angular/core:signals

### 📚 Documentation

- _(changelog)_ Generate CHANGELOG with git-cliff
- _(Readme)_ Infos about git-cliff
- Script for changelog generation

### ⚙️ Miscellaneous Tasks

- Update to angular-eslint 19.0.0-alpha.4

## [7.0.3] - 2024-11-24

### Observations

- Observation Editor: Copy the event date to report date via button click.

### Miscellaneous

- Keyboard shortcuts for navigating the NavBar: #356

# Release Notes - Curated Section

## [7.0.2] - 2024-11-18

### Observations

- Observation Editor: Fix date input on all browsers.

## [7.0.1] - 2024-11-14

### Obervations

- Bugfix for filtering of observations that have been newly created using the Observation Editor.

## [7.0.0] - 2024-11-08

### Bulletins

- Ability to undo/redo actions using Ctrl+Z Ctrl+Y or buttons.
- Add read only mode for bulletins.
- Option to show/hide sidebar.
- Show validation warnings per bulletin.
- Button group for avalanche type. albina-euregio/albina-admin-gui!176

- Select am or pm problems if daytime removed
- _(map)_ Use earlier/later
- _(create-bulletins)_ Prioritze published over saved over suggested regions for coloring the map
- _(create-bulletins)_ Highlight suggested micro regions of selected warning region

### Stress Level

Option to track stress level of the individual users via the bulletin calendar view.
Supported features:

- Can be enabled/disabled for each region via the Admin settings.
- The stress level is selected on a slider with 5 levels.
- Forecasters can view an anonymized line chart comparing stress levels in their team.

### Training Mode

In Training Mode you can create and edit bulletins without with them being synchronized to the server.
Training Mode is always linked to a specific date in the past. This is the simulated date, up to which
you can use the resources (observations, bulletin from the day before) supplied by the admin gui.
As the name suggests this is intended for training purposes, where you can let multiple users
train on the same simulation date and then compare and discuss the resulting bulletins.
Specifically, the following features are supported:

- Configure the training timestamp in Settings.
- The color of the Navbar distinguishes between training mode (green) and normal mode (yellow). The training timestamp is also displayed in the Navbar.
- When using "Load bulletin from the day before" the actual published bulletin from the selected date is loaded from the server.
- While creating the bulletin no communication with the server takes place.
- Training Mode can be used in all roles (also Observer).
- Resulting bulletins can be exported as PDF or JSON.

### AWSOME Dashboard

- _(awsome)_ Dashboard for snp_characteristics.flat.sk38.value
- _(awsome)_ Load awsome.json
- _(awsome)_ Elevation
- _(awsome)_ Aspects
- _(awsome)_ Sources
- _(awsome)_ Load models.avalanche.report/dashboard/awsome.json
- _(awsome)_ Date and dateStep
- _(awsome)_ ConfigURL via config= parameter
- _(awsome)_ Hide navbar unless logged-in
- _(awsome)_ Make tooltip configurable
- _(awsome)_ Show details in sidebar
- _(awsome)_ Mobile
- _(awsome)_ Make sidebar resizable
- _(awsome)_ Docs
- _(awsome)_ Make initially selected values configurable
- _(awsome)_ Date stepper buttons
- _(awsome)_ Support multiple details templates
- _(awsome)_ Support radius by map zoom

### Observations

- _(observations)_ Remember date range in URL
- _(observation-marker.service)_ Add many more fields to FilterSelectionValue
- _(observations)_ Make sidebar resizable
- _(observations)_ Define snobs as own source
- _(observations)_ Use training timestamp
- _(bulletins.service)_ PDF in training mode
- _(observations)_ Use training timestamp
- _(observation-chart)_ Click to set, shift click to add, ctrl click to invert
- _(observations-api)_ Add POST and DELETE
- _(observation-editor)_ Add aspects, stability, elevationLowerBound, elevationUpperBound
- _(observation-editor)_ Add avalancheProblems
- _(observation-editor)_ Add dangerPatterns
- _(observation-editor)_ Add importantObservations
- _(observation-editor)_ Add $source and $type
- _(observation-editor)_ Add personInvolvement
- _(observation-editor)_ ValueAsDate
- _(observation)_ Migrate
- _(observations)_ Color table rows
- _(observations)_ Color selected params in charts
- _(observations)_ Add highlight in rose chart
- _(observations)_ Introduce stacked charts
- _(observations)_ Move text search to table
- _(observations)_ Background gradient only in first column of table
- _(observations)_ Use today as date range end for selection of days
- _(notes)_ Enable notes for all (except observer)
- _(observations)_ Allow revert selecting with ctrl
- _(observations-api)_ Snow line
- _(observation)_ Update generic observation model
- _(observations)_ Filter weather stationsbased on elevation
- _(observations)_ Add advanced layer control dependency
- _(observations)_ Show weather station data as label (incomplete)
- _(observations)_ Optional outer circle for icon
- _(observations)_ Day switcher
- _(observations)_ Allow multiple external images
- _(observations)_ Add buttons for arrowUp and arrowDown

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

### Miscellaneous

- Integrate ZAMG Wetterbox
- compare bulletins
  - _(bulletins)_ Define layout to compare bulletins in default and compact layout #332
  - _(bulletins)_ Always use the compact view for comparing bulletins as intended in the design prototype. #332
  - _(create-bulletins)_ Allow to compare bulletins
- _(weather-stations)_ Data from the past
- _(weather-stations)_ Label marker with weather station parameters
- _(weather-stations)_ Color markers according to selected parameter
- _(weather-stations)_ Add additional parameters
- _(observations)_ Add surface hoar to weather station parameters
- _(observations)_ Add dew point to weather station parameters
- user management
  - _(user)_ Extend user model with languageCode
  - _(user)_ Save user language
  - _(user)_ Show image in table view
  - _(user)_ Allow to update user image
  - _(user)_ Allow user to update own infos and password, remove bcrypt
- map performance
  - _(map.service)_ Use pmtiles for aggregatedRegions
  - _(map.service)_ Use pmtiles for aggregatedRegions
  - _(map.service)_ Use pmtiles for activeSelection
  - _(map.service)_ Fix resetInternalAggregatedRegions
- _(layout)_ Save prefered map layout in local storage
- _(weather-stations)_ Add buttons to select parameters
- _(weather-stations)_ Try different buttons
- _(validity)_ Change validity to 5pm until 5pm **Breaking Change?**
- _(zamg-wbt)_ Open link in new tab
- _(zamg-wbt)_ User has to be logged in
- _(zamg-wbt)_ Add config for region, add to sidebar menu, use i18n labels

### TODO: Where there notable changes in these areas?

- roles: especially observer role (there were some commits in the Bug Fix section)
- synchronisation of bulletins
