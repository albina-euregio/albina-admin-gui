# Changelog

<!-- Update using `yarn changelog <TAG>` before creating new tag <TAG> with git. -->

## [8.0.0] - 2025-11-04

### 🚀 Features

- *(blog)* Publish on whatsapp
- *(publication)* Publish on whatsapp
- *(region-configuration)* Add whatsapp setting
- *(map)* Micro-region thresholds for map visualization
- Show region coat of arms in dropdown
- *(awsome)* Select region when right-clicking
- *(awsome)* Highlight in hazard chart
- *(awsome)* Make micro-regions configurable
- *(awsome)* Override date via date= parameter
- *(awsome)* Try rectangle markers
- *(enable-text-input)* EnableEditableFields configuration option in region settings
- *(enable-text-input)* Added translations for enable editable fields
- *(enable-text-input)* Switch between textcat and text input
- *(enable-text-input)* Added getInternalRegion(region) to retrieve region configuration
- *(enable-text-input)* Clear LangTexts when copying bulletin from region without to region with textcats
- *(general-headline)* Add enableGeneralHeadline configuration option
- *(general-headline)* Add generalHeadlineComment field in create-bulletin component
- *(general-headline)* Remove generalHeadlineComment when copying bulletin if disabled in active region
- *(general-headline)* Set generalHeadlineComment fields when creating additional new bulletins
- *(enable-text-input)* Added getInternalRegion(region) to retrieve region configuration
- *(weather-text-input)* Add enableWeatherTextField configuration option
- *(weather-text-input)* Add synopsisComment fields to bulletin model and create-bulletin component
- *(weather-text-input)* Add weather text field handling to bulletin
- *(region-configuration)* Configure (tts-)languages
- *(regions)* Add ES-AR
- *(awsome)* New click mode
- *(awsome)* ChartAxisRange via config
- *(awsome)* Timeseries chart
- *(awsome)* Hce_from_simplified
- *(awsome)* Hce_from_simplified (reload via chart)
- *(awsome)* Support MultiPolygon
- *(awsome)* AWSOME_CONFIG_URL via env
- *(awsome)* HazardChart.xType from config
- *(awsome)* Hce_from_simplified (domain= and toolchain=)
- *(map)* Sync maps from different browser tabs
- *(awsome)* AWSOME_CONFIG_URL via env
- *(awsome)* I18n
- *(awsome)* Fullscreen button in details pane
- *(awsome)* New click mode (shift)
- *(awsome)* New click mode (left selects region, right selects marker)
- ⌘ on Mac for ctrl key
- *(awsome)* Timeseries chart (show date)
- *(awsome)* Timeseries chart (tooltip with depth and size estimate)
- *(awsome)* Timeseries chart (axis pointer)
- *(awsome)* Hazard chart (diamond marker)
- *(awsome)* INITIAL_URL via env
- *(awsome)* Hce_timeseries (domain= and toolchain=)
- *(awsome)* Charts and details on mobile
- *(awsome)* HazardChart.xAxisLabels from config
- ENABLED_EDITABLE_FIELDS
- *(awsome)* MapCenter from config
- *(awsome)* New click mode (left selects region, right selects marker)
- First Playwright test
- *(awsome)* Update details view when changing aspect or elevation band

### 🐛 Bug Fixes

- *(map)* Attribution href
- *(matrix-parameter)* Check for null
- *(package.json)* Typo
- *(lint)* Add content to buttons
- *(admin-blog)* Remove test part
- *(observation-marker)* No markers shown in Firefox
- *(observation-marker)* No markers shown
- *(awsome)* Sometimes no tab is selected
- *(awsome)* Undefined weight for rectangle markers
- *(enable-text-input)* EnableEditableFields
- Unused import
- *(i18n)* Bulletins.create.label.generalHeadlineComment
- MergeFeatureCollections.ts is missing from the TypeScript compilation
- InternalRegions is undefined
- *(micro-regions)* Use current date for micro region filtering
- ConstantsService.getExternalServerUrl
- *(region-configuration)* TtsLanguages.includes
- *(bulletin)* Init highlights text
- *(create-bulletin)* Empty highlights texts when copying to region with textcat
- *(copy-bulletin)* Subscribe to onHide and reset copying
- *(compare-bulletins)* Button styling
- *(compare-bulletins)* Unset compared bulletin if active bulletin was deselected
- *(bulletin-text)* Show correct diff
- *(diff)* Compare aspects
- *(compare-bulletins)* Sync all accordion groups
- *(compare-variant)* Slab hand hardness
- *(compare)* Coloring of compared headlines
- *(danger-sources)* Remove wrong role="button"
- *(danger-source)* Count of variants
- *(danger-source)* Accordions
- *(danger-source)* Prevent error if weak layer grain shape array is empty
- *(danger-source)* Visualization of variants on map
- *(danger-source)* Color micro regions without danger rating
- *(danger-source)* Compare matrix parameter
- *(compare)* Elevations
- *(awsome)* Timeseries chart (upper confidence-band)
- *(awsome)* Snp_characteristics is undefined
- *(observations)* Use unique IDs for lwdKip
- Console.trace
- *(README)* App.transifex.com
- *(observations)* Missing package es-toolkit
- *(region-configuration)* Default for languageConfigurations
- @typescript-eslint/no-unused-vars
- *(create-bulletin)* Avoid duplicate entries for external regions
- Shift+undefined shortcut
- *(map.service)* This.map.sync (set map center and zoom first)
- *(avalanche-problem)* Tooltip for deleting problem
- Unused import
- Accept/reject bulletin suggestion
- *(region-configuration)* Typo
- *(create-bulletin.component)* JsonBulletinUploader
- *(admin)* Missing password-mismatch imports
- *(danger-source)* Set ownerRegion
- *(upadate-user)* Use isAdmin
- *(danger-sources)* Use id of new danger source
- *(danger-sources)* Clear id when copying
- *(danger-sources)* Init fields when creating new variant

### 🚜 Refactor

- Update to zod 4.0
- *(bulletins.service)* Remove unused publication tests
- *(publication)* Generic publication to channel
- *(publication)* Generic publication to channel
- Migrate from lodash to es-toolkit
- *(map)* Browser.ie/opera12/edge have been removed from leaflet
- *(observations)* Remove unused code
- *(regions)* Use generic region filters
- *(blog)* Improve code structure of blog component, add AT-02
- *(awsome)* @angular/core:control-flow
- *(leaflet)* Use LeafletEventHandlerFnMap
- *(zod)* Z.string.url deprecation
- *(awsome)* Re-generate awsome.schema.json
- *(enable-text-input)* Set enableEditableFields property
- *(authentication-service)* Remove unused getInternalRegion method
- *(bulletin-text)* Remove unnecessary call to authenticationService
- *(server-configuration)* Update zod schema
- *(server-configuration)* Avoid redundant JSON object
- *(server-configuration)* Types
- *(zod)* Prefer nullish over optional
- *(server-configuration)* Allow nullish values for apiUrl, userName, and password fields
- *(authentication-service)* Remove unused getInternalRegion method
- *(map)* Use pinchZoom defaults
- *(zod)* Prefer nullish over optional
- Remove regionsService.getActiveRegion
- Rename internalRegions
- RegionsService.getInternalServerRegionsAsync
- Cleanup regions-loader
- *(augmentRegion)* Async/await loadRegions
- *(augmentRegion)* Async/await initAugmentRegion
- *(types)* Get rid of any
- @trivago/prettier-plugin-sort-imports
- @trivago/prettier-plugin-sort-imports
- @trivago/prettier-plugin-sort-imports
- *(types)* Get rid of any
- Update AuthenticationResponse
- Support legacy AuthenticationResponse
- ConstantsService.getServerUrl
- *(regions-service)* Format date
- *(decision-tree)* Replace buttons, shrink them
- *(danger-sources)* Create danger source
- *(danger-source)* Remove unused import
- Use regionsService.getRegionName
- *(map)* OpenTopoMap toggle
- *(map)* Emphasize region borders
- *(map)* HandleClick
- Support legacy AuthenticationResponse
- Region.coatOfArms
- *(awsome)* StabilityIndex
- *(danger-sources)* Prevent warnings
- Import Map as LeafletMap
- LocalStorageService.key
- *(regions-service)* Use today default of filterFeature
- *(awsome)* Private
- GlobalThis.ENV
- *(rxjs)* ToPromise deprecation
- Array.includes
- Use @types/leaflet 2.0.0
- *(map.service)* Types
- *(map.service)* Move clickRegion
- *(map.service)* Class RegionLayer
- *(map.service)* Class RegionLayer
- *(map.service)* Class RegionLayer
- Use @types/leaflet 2.0.0
- *(region-configuration)* Use RegionConfigurationSchema
- *(region-configuration)* Remove mapXmax/mapXmin/mapYmax/mapYmin
- *(region-configuration)* Remove input id
- *(region-configuration)* Use zod description
- *(map.service)* Fit map bounds
- *(region-configuration)* Remove mapCenterLat and mapCenterLng
- *(admin)* @angular/core:control-flow
- Refact(zod)
- *(map.service)* Fit map bounds (awsome w/o login)
- *(observations)* ObservationFilterService.regions as Set
- *(observations)* ObservationFilterService.regions as Set
- *(observation-marker)* Simplify svg
- *(observation-marker)* Simplify svg
- *(server-configuration)* Remove input id
- *(observations)* @angular/core:control-flow
- Remove obsolete websockets support
- *(configuration.service)* Use same endpoint for create and update
- *(user.service)* Combine endpoints
- *(dangers-sources)* Parse /status using zod
- *(dangers-sources)* Parse using zod
- *(danger-sources)* @angular/core:control-flow
- *(danger-sources)* Toggle-btn-group component
- *(danger-sources)* Toggle-btn-group component
- *(danger-sources)* Toggle-btn-group component
- *(danger-sources)* Toggle-btn-group component
- *(danger-sources)* No for="textarea-input"
- *(danger-sources)* No for="..."
- *(toggle-btn-group)* Types
- *(settings.component)* Simplify
- TranslateService.currentLang deprecation
- *(toggle-btn-group)* Unused NgClass
- *(awsome)* Remove obsolete JSON NaN fix
- *(danger-sources)* Remove unused deleteVariantOnServer
- *(danger-sources)* Merge saveVariantOnServer

### 📚 Documentation

- *(README)* Deployment

### 🧪 Testing

- Admin settings
- Pdf and JSON download of bulletin

### ⚙️ Miscellaneous Tasks

- *(suggestions)* Show suggestion if bulletin is not editable (but no button to accept/reject)
- Update protomaps-leaflet
- *(admin)* Spacing
- *(matrix)* Limit matrix parameter range depending on avalanche type
- *(matrix-paramater)* Restrict snowpack stability and frequency according to avalanche type
- Update to echarts 5.6.0
- Update to angular 20.0.0
- Update to angular-eslint 19.6.0
- Upgrade to leaflet 2.0.0-alpha
- Update to angular 20.0.1
- *(AT-02)* Add code for carinthia (AT-02)
- *(aggregated_regions)* Add AT-02
- *(matrix)* Allow to select (nearly) none for frequency
- *(matrix)* Update matrix according to EAWS GA 2025
- *(create-bulletins)* Add button to show/hide external regions
- Update to angular 20.1.0
- Update to angular-eslint 20.1.1
- Update to ngx-echarts 20.0.1
- *(app)* Use Fetch API
- *(awsome)* Split layout-right into top/bottom
- Update to latest leaflet#main
- *(.gitlab-ci)* Enable merge request pipelines
- *(enable-text-input)* Removed all translations (managed by transifex)
- *(enable-text-input)* Removed console log statement
- *(i18n)* Update translations
- Update to zod 4.0.14
- *(map)* Fix pointerover/pointerout, class RegionNameControl
- *(map)* Class RegionNameControl
- *(awsome)* Handle Polygon as Point (as a first step)
- *(awsome)* Render Polygon
- Update to ngx-translate 17
- Update to ngx-bootstrap 20
- Update to bootstrap 5.3.7
- Update to echarts 6.0.0
- *(i18n)* Update translations
- *(license)* Define AGPLv3 license in package.json
- Upgrade to leaflet 2.0.0-alpha1
- *(eaws-regions)* Upgrade to v8.0.0
- *(micro-regions)* Update aggregated regions with new micro regions
- Update to angular 20.2.1
- *(create-bulletin)* Add dummy button to keep layout
- *(create-bulletin)* Disable compared bulletin
- *(bulletin-text)* Add padding below
- *(bulletin-text)* Style show/hide translations
- *(mindset)* Use cursor help over info button
- *(compare-bulletin)* Color compare button of compared bulletin, disable compare with second click on button
- *(package)* Add diff-match-patch dependency
- *(create-bulletin)* Show diff for compared bulletins texts
- *(package)* Add diff-match-patch dependency
- *(yarn.lock)* Update
- *(bulletin)* Add padding after danger patterns
- *(create-bulletin)* Color compared bulletin in map
- *(create-bulletin)* Select compared bulletin with CTRL + click
- *(variant)* Disable compared variant
- *(compare-variants)* Color compare buttons, disable compare with second click on button
- *(variants)* Sync accordions
- *(variants)* Show analysis/forecast in variant view
- *(variants)* Show diff
- *(create-bulletin)* Sync avalanhe problem accordions
- *(create-bulletin)* Add diff for avalanche problems
- *(map)* Allow up to zoom level 12
- *(map)* Allow scrollWheelZoom and doubleClickZoom
- *(map)* Show OpenTopoMap on zoom level 13 - 15, closes #424
- *(bulletin)* Add padding after tendency buttons
- *(compare-bulletins)* Show diff for tendency
- *(compare-bulletins)* Show diff for danger patterns
- *(variants)* Allow multiple grain shapes for weak layer
- *(variant)* Color compared variant on map
- *(variant)* Compare with CTRL + click
- *(maps)* Update map layers for PM map, emphasize region borders in zoom level 13 - 15
- *(danger-source)* Do not create the first variant together with the danger source
- *(danger-source)* Adopt matrix to avalanche type
- *(danger-source)* Show avalanche type above accordion
- *(danger-source)* Move penetrateDeepLayers to accordion group avalanche
- *(danger-source)* Reset matrix information if avalanche type changes
- *(danger-source)* Add groups for slab and weak layer
- *(danger-source)* Remove sunny and shady slopes from terrain types
- *(danger-source)* Filter parameters based on avalanche type
- *(danger-source)* Add glide_cracks to danger signs
- *(danger-source)* Diminish unlikely options based on avalanche type
- *(eaws-regions)* Upgrade to v8.0.2
- *(eaws-regions)* Upgrade to v8.0.3
- *(eaws-regions)* Upgrade to v8.0.5
- *(build)* Yarn 4.9.4
- Update to angular 20.3.1
- *(vscode)* Editor.formatOnSave
- *(danger-source)* Allow to collapse danger source variants
- *(danger-source)* Sort danger sources by status and color them accordingly
- *(danger-source)* Sort variants
- *(danger-source)* Add button to show variants of one danger source on map
- *(colors)* Add muted color for no snow and missing danger rating
- *(danger-source)* Load danger sources only for active region
- *(danger-source)* Extend danger source model with ownerRegion
- *(danger-source)* Allow only own micro regions
- *(danger-source)* Show arrow to expand variants
- *(observations)* Add alt to markers
- Use globe-hemisphere-west icon
- *(awsome)* Timeseries chart (use type)
- *(awsome)* Hazard chart (size_estimate)
- *(awsome)* $date
- *(awsome)* Hazard chart (size, inline)
- *(awsome)* Timeseries chart (config.timeseriesChart.url)
- *(awsome)* Allow $schema in config
- *(awsome)* Hazard chart (color by grainType)
- *(awsome)* Update awsome.json
- *(forecast)* W-100
- *(forecast)* Role="button"
- *(observations)* Role="button"
- *(awsome)* Reload button
- *(awsome)* Keyboard shortcuts
- *(awsome)* Update awsome.json
- *(awsome)* Snp_characteristics.$stabilityIndex.instabilityDrivenBy
- *(awsome)* Hazard chart (gray background)
- *(awsome)* Hazard chart (gray background)
- *(danger-source)* Update danger source list in place
- *(awsome)* Tooltip and axisPointer
- *(awsome)* Update awsome.json
- *(awsome)* Update awsome.json
- Update to zod 4.1.11
- Update to ngx-bootstrap 20.0.2
- *(awsome)* Conditionally render tab content
- *(i18n)* Update translations
- Update to sentry 10.17.0
- *(build)* Yarn 4.10.3
- *(awsome)* NameLocation for xAxis
- *(eaws-regions)* Upgrade to v8.0.6
- *(awsome)* Load only active sources
- *(awsome)* Cancel old timeseries chart request
- *(awsome)* Hazard-chart size
- *(awsome)* Hazard-chart grid size
- *(awsome)* Timeseries chart (do not require all indices)
- *(awsome)* Timeseries chart (allow nullish)
- *(awsome)* StabilityIndex (via config)
- *(awsome)* StabilityIndex (request query parameter)
- *(vscode)* Unset scss.editor.defaultFormatter
- *(awsome)* Timeseries chart (confidence-band2)
- *(awsome)* Map height w/o navbar
- *(eaws-regions)* Use @eaws/pmtiles/eaws-regions.pmtiles
- *(awsome)* Map height w/o navbar
- *(region-configuration)* Add coatOfArms and staticUrl
- *(region-configuration)* Add languageConfiguration
- *(region-configuration)* Add defaultLang
- *(region-configuration)* Add languageConfiguration
- *(region-configuration)* Add languageConfiguration
- *(region-configuration)* Validate languageConfiguration
- *(region-configuration)* Validate general configuration
- *(region-configuration)* Validate general configuration (csv)
- *(region-configuration)* Validate general configuration (id)
- *(awsome)* BorderWidth and borderDashArray from config
- *(region-configuration)* Csv()
- *(server-configuration)* Validate config
- *(observation-editor)* Validate input
- Upgrade to leaflet 2.0.0-alpha.1-51-gf8fef451
- Update protomaps-leaflet
- *(gitlab-ci)* Only run playwright chromium in pipeline
- *(i18n)* Update translations
- Update to angular 20.3.7
- Update awsome.json
- *(danger-sources)* DangerSourcesService.saveDangerSource: no {id} in path, return dangerSource
- *(danger-sources)* DangerSourcesService.replaceVariants
- *(danger-source)* DangerSourcesService.saveDangerSourceVariant
- *(i18n)* Update translations
- *(eaws-regions)* Upgrade to v8.0.8
- *(danger-sources)* Crypto.randomUUID
- *(danger-sources)* Select after copying

### Playwright

- Check navbar-links
- Test language setting and statistic download
- Danger source statistic + user settings
- Refactor
- View bulletins
- Load bulletin from the day before
- Observation tests
- Missing snapshots
- Observation tests
- Edit bulletin
- Update tests
- README+Dockerfile
- Try to avoid flaky tests
- More bulletin tests
- Remove unused snapshots
- Update tests
- Login admin
- WaitForGetEdit
- Update icon

### Build

- Silence SASS deprecations
- Configure outputPath.browser

### Chow

- *(awsome)* Show markers w/o classification

## [7.1.13] - 2025-04-25

### 🐛 Bug Fixes

- CurrentAuthor is undefined
- Allow null for enum types of matrix information
- Remove latitude/longitude bounds filter in AWSOME dashboard
- Continue if one source fails to load in AWSOME dashboard
- Fetch bulletins from SLF for correct date
- Fix CSV export for observations

### ⚙️ Miscellaneous Tasks

- Update to zod 4.0.0-beta.20250420T053007

### 🚜 Refactor

- Use zod
- Use Temporal

### Observations

- Add shortcuts to select the last 1 to 7 days
- Add multi-level dropdown for region selection
- Shrink and center QFA table

## [7.1.12] - 2025-04-17

### Bulletins

- Fetch bulletins for SLF

### ⚙️ Miscellaneous Tasks

- Upgrade to zod 4.0.0-beta
- Upgrade to Yarn 4.9.1

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
