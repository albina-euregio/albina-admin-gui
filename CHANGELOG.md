# Changelog

<!-- Update using `pnpm changelog <TAG>` before creating new tag <TAG> with git. -->

## [9.0.0] - 2026-07-26

### 🚀 Features

- **Avalanche Incident Database**
- **Migrate all maps from Leaflet to MapLibre GL**
- Use PMTiles raster basemap
- Set document title based on route
- Use hostname as document title suffix
- _(api)_ Enable zod plugin for hey-api client
- _(api)_ Generate typed Albina API client with hey-api
- _(publication-checklist)_ Minimal publication button
- _(region-config)_ Add per-region awsomeUrl for modelling config
- _(settings)_ Let users pick an effective role to restrict their permissions

### 🐛 Bug Fixes

- _(awsome)_ Prefer circle marker tooltip over polygon underneath
- _(bulletins)_ Serialize external regions as repeated query params
- _(bulletins)_ Serialize internal regions as repeated query params
- _(danger-rating)_ Wrap img tag in conditional check
- _(danger-sources)_ Open forecast when jumping to unpublished date
- _(env)_ Make start-local explicitly target the localhost:8080 backend
- _(i18n)_ Strip seconds from all time formats and comma from date-time
- _(i18n)_ Use the real Occitan locale instead of English
- _(map)_ Keep zoom as top-level step input in region line paint
- _(map)_ Region click ignores points/polygons rendered on top
- _(map)_ Teardown race throwing errors for map.getLayer
- _(media)_ Always send boolean important query param on upload
- _(observation-editor)_ Diff form changes against an independent snapshot
- _(observation-editor)_ Render danger source as select
- _(observations)_ Stop marker click from reaching region layer
- _(observations)_ Keep marker tooltip above markers
- _(observations)_ Place region-name control top-right and style it
- _(qfa)_ Fix location for dust lookup
- _(qfa)_ Guard QFA UI against missing file
- _(qfa)_ Iterate dust forecast steps up to 210 hours
- _(qfa)_ Parse metadata header in both spacing layouts

### 🚜 Refactor

- _(constants)_ Drop unused createSearchParams helper
- _(danger-source)_ Use zod-schema-form
- _(danger-sources)_ Do not fetch in constructor; require explicit init()
- _(env)_ Move env.<name>.js snippets next to environment.ts
- _(env)_ Use runtime env.js as single source of truth for URLs
- _(hey-api)_ Use generated hey-api client in AuthenticationService
- _(hey-api)_ Use generated hey-api client in BlogService
- _(hey-api)_ Use generated hey-api client in BulletinsService
- _(hey-api)_ Use generated hey-api client in ConfigurationService
- _(hey-api)_ Use generated hey-api client in IncidentService
- _(hey-api)_ Use generated hey-api client in MediaFileService
- _(hey-api)_ Use generated hey-api client in StatisticsService
- _(hey-api)_ Use generated hey-api client in StatusService
- _(hey-api)_ Use generated hey-api client in UserService
- _(hey-api)_ Use hey-api client with external base URL in ExternalBulletinsService
- _(observation-editor)_ Use zod-schema-form
- _(publication-checklist)_ Minimal publication as own section
- _(region-configuration)_ Use zod-schema-form
- _(server-configuration)_ Use zod-schema-form
- _(angular)_ ChangeDetectionStrategy.Eager for angular 22 compatibility
- _(angular)_ Collapse identical local build config into development
- _(angular)_ Drop redundant TranslateService provider entry
- _(angular)_ Move AlbinaObservationsService to component providers
- _(angular)_ Move BlogService to component providers
- _(angular)_ Move ConfigurationService to component providers
- _(angular)_ Move ElevationService/GeocodingService to component providers
- _(angular)_ Move IncidentService to component providers
- _(angular)_ Move map services to component providers
- _(angular)_ Move MediaFileService to component providers
- _(angular)_ Move observation marker services to component providers
- _(angular)_ Move ObservationFilterService to component providers
- _(angular)_ Move QFA services to forecast component providers
- _(angular)_ Move StatisticsService to component providers
- _(angular)_ Move StatusService to component providers
- _(angular)_ Move toggle-btn-group
- _(angular)_ Remove unused+deprecated @angular/animations
- _(angular)_ Use providedIn root for remaining global services
- _(angular)_ Use publication strategies
- _(angular)_ Use withHashLocation() router feature for hash URLs

### 🧪 Testing

- Add QFA file parsing test
- Adapt playwright tests to maplibre canvas rendering

### ⚙️ Miscellaneous Tasks

- Update to ngx-echarts 22.0.0
- Upgrade to ngx-translate 18.0.0
- Update to ngx-quill 31.0.0
- Use albina-basemap.pmtiles
- _(eaws-regions)_ Update to v8.4.0
- Update temporal-polyfill to 1.0.1
- Cache pnpm store and Angular build cache
- _(env)_ Type-check env.<name>.js against the Environment interface
- _(incident)_ Improve alert message and deletion of invalid reports
- _(incident)_ Do not show empty tabs with green checkmark
- _(incident)_ Remove alert box for required fields missing
- _(incident)_ Separate edit and preview buttons
- _(incident)_ Increase trash-button size
- _(api)_ Drop openapi-typescript in favour of hey-api
- _(eslint)_ Update ignore path for generated albina-api client
- _(readme)_ Add sections functional development & contact and license

## [8.4.2] - 2026-06-03

### 🚀 Features

- _(graphics)_ Add team stress level chart
- _(graphics)_ Add danger source plots
- _(create-bulletin)_ Show publication-in-progress
- _(publication-checklist)_ Major improvements
- _(publication-checklist)_ Store on server
- _(publication-checklist)_ Add print version
- _(weather)_ Add weather maps (ICON and GFS)
- _(bulletin)_ Add X for no danger-rating-modificator, check presence of selection
- _(bulletin)_ Allow to select no_snow as danger rating for warning region
- _(config)_ Add education URL to region configuration
- _(bulletin)_ Allow to upload photos to bulletin

### 🐛 Bug Fixes

- _(statistics)_ Show alert when download failed
- _(danger-sources)_ Do not rebuild variants list
- _(qfa)_ Ignore timestamp of file transfer
- _(textcat)_ Improve copying of texts
- _(compare-bulletin)_ Fix compare text after text change
- _(graphics)_ Show menu entry only if enableLineaExport
- _(bulletins.service)_ Load status for active date outside of preloaded range

### 🚜 Refactor

- _(weather-stations)_ Use LINEA features

### 🧪 Testing

- _(observations)_ Update weather station tests

### ⚙️ Miscellaneous Tasks

- _(settings)_ Oxc as default formatter for HTML files
- _(linea)_ Update to v8.24.2
- _(pnpm)_ Upgrade to v11.3.0
- _(vite-plus)_ Upgrade to v0.1.24
- _(zod)_ Upgrade to v4.4.3
- _(weather-box)_ Remove component

## [8.4.1] - 2026-04-10

### 🚀 Features

- Allow to load danger source variants from forecast

### 🐛 Bug Fixes

- Fix QFA

## [8.4.0] - 2026-04-08

### 🚀 Features

- Extend LINEA export functionality (menu entry Graphics)
- Separate /forecast and /analysis for danger sources
- Store images for bulletins
- Add upload/download functionality for bulletins in CAAML format
- Fetch observations from SNOBS as JSON

### 🐛 Bug Fixes

- Fix ordering of danger sources
- Set default values for dangerRating and BulletinDaytimeDescriptionSchema
- Nasty topy in CreateBulletinComponent.save
- Fix status loading logic for bulletins
- Clear id and publicationDate in copyBulletin
- GetValidFromUntil on date of DST change
- Mirror bulletin status update from server
- Fix date is undefined while creating bulletins

### 🚜 Refactor

- Parse AvalancheProblem using zod
- Parse BulletinDaytimeDescription using zod
- Parse BulletinModel using zod
- Remove unused terrainFeature
- Remove superseded /modelling/snowpack
- Config textfields (free text, textcat) via lists in region object
- Remove unused setTendency
- Add confirmation dialog when loading suggestions
- Restructure bulletin menu

### ⚙️ Miscellaneous Tasks

- Migrate to vite-plus
- Update to eslint 10.1.0
- Update openapi.d.ts
- Update to oxfmt 0.42.0
- Update to pnpm 10.33.0
- Update to linea v8.16.0
- Update to angular 21.2.6

## [8.3.0] - 2026-03-05

### 🚀 Features

- Validate all API parameters using openapi-typescript
- Implement undo/redo for danger sources
- Add title to danger source variant
- Add BulletinModel.saveDate
- Skip addInternalBulletins while editRegions
- Disable media file upload button during upload

### 🚜 Refactor

- Use orderBy from es-toolkit
- LocalServerInstance
- Region.serverImagesUrl

### ⚙️ Miscellaneous Tasks

- Update to linea v8.7.4
- Update to eaws-regions v8.2.0
- Update to ngx-bootstrap 21.0.1
- Update to playwright 1.61.1
- Update protomaps-leaflet
- Update to angular 21.2.0
- Update to eslint 9.39.3

### Build

- Migrate to oxfmt

## [8.2.1] - 2026-02-09

### 🐛 Bug Fixes

- Undefined activeRegion after logout
- Load bulletins from yesterday

### ⚙️ Miscellaneous Tasks

- Update linea to v8.7.1

## [8.2.0] - 2026-02-02

### 🚀 Features

- Add LINEA export in main menu
- Add configuration parameter to enable LINEA export per province
- Disable mapBounds for observations

### 🐛 Bug Fixes

- Fix memory leaks in leaflet maps

### ⚙️ Miscellaneous Tasks

- Update to es-toolkit 1.44.0
- Upgrade to eaws-regions v8.1.2
- Update to angular 21.1.0
- Updated to linea 8.4.2

### 🚜 Refactor

- Introduce elevation component
- Remove BulletinLockModel (websockets are not used)
- Remove BulletinUpdateModel (websockets are not used)

## [8.1.0] - 2026-01-12

### 🚀 Features

- Request and display status information for enabled publication channels
- Add micro-regions for SI
- Support relative URLs in AWSOME
- Do not expand danger sources with inactive variants only
- Color headline of inactive danger sources grey

### 🐛 Bug Fixes

- danger-sources: Click on map opens most relevant variant
- Immediately update local activeBulletin map state

### ⚙️ Miscellaneous Tasks

- Yarn 4.12.0
- Update to ngx-echarts 21.0.0
- Update to angular-eslint 21.0.1
- Update to zone.js 0.16.0
- Update to angular 21.0.4
- Upgrade to eaws-regions v8.1.1
- Upgrade to leaflet 2.0.0-alpha.1-98-g611aee1c
- Update to zod 4.3.2

### Temporal

- Prefer native implementation

### Build

- Silence SASS deprecations

## [8.0.5] - 2025-12-09

### 🐛 Bug Fixes

- Show correct danger source variant type in compared variant view

### ⚙️ Miscellaneous Tasks

- Color overview map only with danger source variants which are active
- Add read only mode for danger sources

## [8.0.4] - 2025-12-09

### 🐛 Bug Fixes

- Reload status of danger sources map after region change
- Keep accordion for avalanche problem open after update
- Concat external url with token for observations coming from SNOBS
- Observations-API: Data too long for column 'LOCATION_NAME'

### ⚙️ Miscellaneous Tasks

- Observations-API: Upgrade Astro to 5.16.4

## [8.0.3] - 2025-11-28

### 🐛 Bug Fixes

- Sort danger source variants by danger rating, snowpack stability and avalanche size

### 🚜 Refactor

- Remove @sentry/angular

### ⚙️ Miscellaneous Tasks

- Sort danger sources by creation date

## [8.0.2] - 2025-11-26

### 🐛 Bug Fixes

- Set height of hidden elements to 0 in observations dashboard
- Use correct translation strings for remote triggering and weak layer distribution (danger sources)
- Init weakLayerGrainShapes (danger sources)
- Save terrain types (danger sources)
- Generate max 4 avalanche problems from danger source variants (danger sources)
- Highlight cut slopes for glide avalanches, diminish shady slopes for glide avalanches (danger sources)

## [8.0.1] - 2025-11-10

### 🐛 Bug Fixes

- Show danger sources w/o variants
- Use snowgrid_ECMWF_EPS_stationlist.txt for map markers
- Set password when creating user

### ⚙️ Miscellaneous Tasks

- Do not store ALBINA_LOLA_KRONOS_API_TOKEN in database

## [8.0.0] - 2025-11-04

### Breaking Changes

- This project is now licensed under the GNU Affero General Public License v3.0

### 🚀 Features

- Add automated Playwright tests
- Limit matrix parameter range based on avalanche type
- Allow selecting “(nearly) none” as a frequency option in matrix parameters
- Add WhatsApp settings
- Display region coat of arms in the region selection dropdown
- Improve the [AWSOME](https://gitlab.com/groups/avalanche-warning/-/wikis/home) dashboard for snowpack simulations
- Allow choosing between the catalog of phrases and free-text input
- Add an optional general headline for bulletins
- Add an optional weather section for bulletins
- Extend region configuration (languages, coat of arms, static URL, default language)
- Show differences between bulletins
- Show differences between danger sources
- Extend and improve danger source management
- Load bulletins directly from danger sources
- Display [OpenTopoMap](https://opentopomap.org/about) for zoom levels above 12
- Add button to show or hide external regions on the map
- Add new regions: ES-AR and AT-02
- Introduce updated [micro-regions](https://gitlab.com/eaws/eaws-regions)

### ⚙️ Miscellaneous Tasks

- Upgrade all dependencies to the latest versions
- Add documentation for deployment

### 🚜 Refactor

- Simplify region configuration and load several parameters from avalanche-warning-maps
- Remove obsolete WebSocket support
- Merge create and update endpoints
- Use [Zod](https://zod.dev/) for parsing and validation

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
