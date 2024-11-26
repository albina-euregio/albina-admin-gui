# Changelog

All notable changes to this project will be documented in this file.

## [unreleased]

### 🚜 Refactor

- @angular/core:signals
- @angular/core:signals
- @angular/core:signals

### 📚 Documentation

- *(changelog)* Generate CHANGELOG with git-cliff
- *(Readme)* Infos about git-cliff
- Script for changelog generation

### ⚙️ Miscellaneous Tasks

- Update to angular-eslint 19.0.0-alpha.4

## [7.0.3] - 2024-11-24

### 🚀 Features

- *(full-layout.component)* Add shortcuts using mousetrap
- *(observation-editor)* Button to copy event date

### 🐛 Bug Fixes

- *(create-bulletin.component)* Perform copy after deletion in loadBulletinsFromYesterday
- *(meteogram.service)* $externalURL
- *(multimodel.service)* $externalURL
- *(snow-line)* Jump always to next diagram that is different
- Width=fill-available
- *(observations)* Lawis.at/profile PDF URL

### 🚜 Refactor

- *(observations-api)* Reorganize files
- *(observation-editor)* SetDate

### 🎨 Styling

- *(observation-editor)* Improve spacing

### ⚙️ Miscellaneous Tasks

- Update to angular 19.0.0
- *(awsome)* Obtain aspects for snp_characteristics from config

## [7.0.2] - 2024-11-18

### 🚀 Features

- *(observation-editor)* Set on AfterViewInit

## [7.0.1] - 2024-11-14

### 🚀 Features

- *(observation-editor)* Split date/time for valueAsDate

### 🐛 Bug Fixes

- *(strategic-mindset)* Replace risk with hazard
- *(observations.component)* Reload observations after saving and deleting
- *(observation.component)* Properly display error messages

### 🚜 Refactor

- Run svgo on favicon/logo SVG
- *(observations)* Move edit dialog from table to main component
- *(observation-table.component)* Clean up imorts
- *(observations.component)* Combine variables for observation editor
- *(observations)* Clean up
- *(observations.component)* Disambiguate dialog functions

### ⚙️ Miscellaneous Tasks

- *(eaws-regions)* Upgrade to v7.0.0
- Admin.avalanche.report/umfrage-entscheidungsbaum
- Favicon/logo SVG for Aran
- Update to ngx-translate 16
- *(team-stress-levels)* Use fixed yAxis 0…100
- *(i18n)* Update translations
- *(observations)* ApplyLocalFilter after updating observations
- *(build)* Yarn 4.5.1
- *(observations-api)* Astro 4.12.3

## [7.0.0] - 2024-11-08

### 🚀 Features

- *(bulletins)* Style region name popup in map #323
- Update cards to bootstrap5
- *(bulletins)* Allow show/hide left sidebar on mobile #320
- *(bulletins)* Allow show/hide left sidebar only on mobile #320
- *(bulletins)* Define layout to compare bulletins in default and compact layout #332
- *(bulletins)* Allow scrolling to selected region on mobile (landscape) #322
- *(bulletins)* Design publish/submit/update/change buttons #319
- *(bulletins)* Replace default bootstrap sidebar toggle icon
- *(bulletins)* Fix region menu opens in wrong position #303
- *(bulletins)* Show sidebar toggle icon on map, in case there is no warning region defined yet #320
- *(bulletins)* Always use the compact view for comparing bulletins as intended in the design prototype. #332
- *(bulletins)* Fix dropdown menu overlay with bulletin sidebar icon #320
- *(bulletins)* Full-width modal on small screens #326
- *(bulletins)* Place the full-width modal above the map and sidebar #326
- *(observations)* Separate /albina/api_ext/ and /albina_dev/api_ext/
- *(bulletins)* Load 7 more bulletins
- Skip bulletin update if ETag unchanged
- Track stress level (UI part)
- Track stress level (POST)
- Integrate ZAMG Wetterbox as iframe
- Integrate ZAMG Wetterbox as link
- *(observations)* Remember date range in URL
- Track stress level (UI part)
- Track stress level (POST)
- Track stress level (GET+POST)
- *(stress-level)* Team stress levels
- *(weather-stations)* Data from the past
- *(awsome)* Dashboard for snp_characteristics.flat.sk38.value
- *(awsome)* Load awsome.json
- *(awsome)* Elevation
- *(awsome)* Aspects
- *(awsome)* Sources
- *(awsome)* Load models.avalanche.report/dashboard/awsome.json
- *(awsome)* Date and dateStep
- *(awsome)* ConfigURL via config= parameter
- *(awsome)* Hide navbar unless logged-in
- *(awsome)* Make tooltip configurable
- *(awsome)* Show details in sidebar
- *(awsome)* Mobile
- *(observation-marker.service)* Add many more fields to FilterSelectionValue
- *(observations)* Make sidebar resizable
- *(awsome)* Make sidebar resizable
- *(awsome)* Docs
- *(create-bulletin)* Undo/redo using Ctrl+z Ctrl+y
- *(avalanche-bulletin)* Undo/redo buttons
- *(undo-redo.service)* Clear redo stack
- *(undo-redo.service)* Cap undo stack at 100 entries
- *(avalanche-bulletin.component)* Tooltips for undo/redo
- *(undo-redo.service)* More useful console messages
- *(observations)* Define snobs as own source
- *(settings)* Configure training timestamp
- *(settings)* Green navbar when training enabled
- *(settings)* Training timestamp in navbar
- *(bulletins)* Use training timestamp for table
- *(bulletins)* Hide stress level when training
- *(observations)* Use training timestamp
- *(bulletins.service)* Training mode
- *(bulletins.service)* Training mode
- *(bulletins.service)* PDF in training mode
- *(observations)* Use training timestamp
- *(awsome)* Make initially selected values configurable
- *(awsome)* Date stepper buttons
- *(awsome)* Support multiple details templates
- *(training mode)* Load bulletins from day before in training mode
- *(training mode)* Observers are upgraded to forecasters in training mode
- *(awsome)* Support radius by map zoom
- *(observation-chart)* Click to set, shift click to add, ctrl click to invert
- *(observations-api)* Add POST and DELETE
- *(observation-editor)* Add aspects, stability, elevationLowerBound, elevationUpperBound
- *(observation-editor)* Add avalancheProblems
- *(observation-editor)* Add dangerPatterns
- *(observation-editor)* Add importantObservations
- *(observation-editor)* Add $source and $type
- *(observation-editor)* Add personInvolvement
- *(observation-editor)* ValueAsDate
- *(observation)* Migrate

### 🐛 Bug Fixes

- All services to app.module providers
- All services to app.module providers
- Do not show null avatar
- *(types)* Use string instead of String
- *(avalanche-problem-decision-tree)* No fall-through in event handler
- *(avalanche-bulletin)* Show edit micro regions for own bulletins
- *(avalanche-bulletin)* Hide edit micro regions buttons for some status
- Remove EUREGIO region specialities
- *(bulletins.service)* LoadExternalBulletins skip isInternalRegion
- *(bulletin-map)* Keep editSelection on update
- *(status)* Load status on region change
- *(observations)* Stacked charts
- *(external-regions)* Check for null
- *(bulletins)* Show edit button not for role observer
- *(create-bulletin)* Show copy button not for role observer
- *(create-bulletin)* Check role on init
- *(avalanche-bulletin)* Show copy region button not for role observer
- *(qfa)* Month "Mar" and "Jun"
- *(qfa)* Disable swipe to allow horizontal scrolling of table
- *(create-region)* Show correct text
- *(settings-service)* Check for null
- *(bulletin.model)* GetRegionsByStatus
- *(observations)* Duplicated CSS
- *(create-bulletin)* Use query param for read only mode
- *(bulletin-text)* Simplify disabled
- *(bulletin-text)* Undefined
- *(daytime)* Allow cancel
- *(create-bulletin)* Deselect bulletin if region select canceled
- *(bulletins)* Region selection overlay #326
- *(bulletins)* Mobile nav- and sidebar #315, #321, #331
- App.module
- *(bulletins)* Avalanche problem icons extend available area #298
- *(bulletins)* Keep image size ratio on small displays #327
- *(bulletins)* Vertical align danger- and problem icons
- Align buttons in card-footer
- *(observations)* Count of selected micro regions (hack)
- *(observations-api)* Augment region
- *(build)* Deploy:observations-api
- *(observations-api)* Skip old wikisnow
- *(observations-api)* JSON.stringify
- *(matrix)* Add margin to checkbox
- *(observation)* Restore initial layout
- *(create-bulletin)* NativeElement on undefined
- *(region)* Change region fix
- *(weather-stations)* Apply filters only once
- Yarn.lock
- *(yarn.lock)* Revert file
- *(observations-api)* Lawis.at/incident URL
- *(observations)* I18n
- $header-nav-height: 60px
- *(i18n)* Typo
- Lint errors
- "AWSOME"
- *(weather-stations)* Do not allow highlighting of weather stations
- *(bulletins)* [Date, Date] for validFrom/validUntil
- *(create-bulletin)* Remember accepted/declined suggestions
- *(avalanche-problems)* Check only avalanche problems in own province
- *(avalanche-problem)* Style of up/down buttons
- *(avalanche-problem-preview)* Margin of elevations
- *(region)* Save missing configuration parameters
- *(observation-marker)* No classify
- *(observation-api)* Robustness
- *(observation-filter)* Bad performance of getISODateString
- *(observation-chart)* Undefined
- *(observation-filter)* Array types
- *(modal-media-file.component)* Date
- *(observations)* Do not open new modal when using arrow keys
- *(observations)* Update tooltip, fixes #355
- *(observations)* Tooltip, fixes #355
- *(create-bulletin.component)* Tooltip
- *(stress-level)* Date for style
- *(observations)* Duplicate requests
- *(stress-level)* Debounce by date
- *(observation-filter)* Filtering for day or elevation
- *(observations)* Elevation filter for weather stations
- *(observations)* Elevation filter for weather stations
- *(observation-filter)* Order of filter types
- *(stress-level)* Load stress level for additional dates
- *(date)* Copy dialog
- *(statistics)* Typo
- *(search-params)* Array handling
- *(search-params)* Use regions (plural) in url
- *(awsome)* Selected count
- *(make-icon)* Escape HTML chars of label
- *(full-layout.component)* Types
- *(awsome)* Typo in configURL
- *(awsome)* DateStepSeconds in schema
- *(app.component)* Init i18n
- *(observations.component)* Keyboard shortcuts
- *(danger-sources)* Update map after delete
- *(danger-sources)* Compare variants by creationDate, set creationDate correctly
- *(danger-sources)* Copy variant
- *(danger-sources)* Add empty method for compability
- *(danger-sources)* Gliding snow slider
- *(danger-sources)* Sort by danger rating
- *(danger-sources)* I18n key
- *(danger-sources)* Copy only analysis variants from yesterday
- *(danger-sources)* Variant constructor
- *(elevation)* Store changes, initialize checkbox correctly
- *(bulletins.service)* Do not init in constructor
- *(undo-redo.service)* Undefined
- *(create-bulletin.component)* BulletinsService.init
- AngularCompilerOptions.strictTemplates
- *(strategic-mindset)* Template name
- *(no-distinct-avalanche-problem)* Use same wording everywhere
- *(avalanche-problem)* Rename no distinct avalanche problem icons
- *(bulletins.service)* Next and previous date
- *(awsome)* Date stepper buttons (call loadSources)
- *(authentication.service)* No_distinct_avalanche_problem
- *(observation-marker)* Undefined
- *(observations)* Undefined

### 🚜 Refactor

- Import package.json
- *(avalanche-bulletin)* Simplify openTextcat
- *(avalanche-bulletin)* Textcat types
- *(bulletins)* Prettier
- *(avalanche-bulletin)* Simplify if
- *(avalanche-bulletin)* Unused variables
- *(avalanche-bulletin)* Simplify concatTextcat
- *(avalanche-bulletin)* Simplify setAvalancheProblem
- Remove unused class ConditionsModel
- Remove unused enums
- *(models)* Simplify if
- *(map.service)* Types
- *(avalanche-bulletin)* GetTextcatRegionCode
- *(avalanche-bulletin)* NgFor for tendency types
- *(avalanche-bulletin)* Type Tendency = "decreasing"|"steady"|"increasing"
- *(avalanche-bulletin)* NgFor lang of translationLanguages
- *(avalanche-bulletin)* Simplify textcat example texts
- *(avalanche-bulletin)* Use string templates
- *(bulletin.model)* Inline textcat getters/setters
- *(avalanche-bulletin)* Simplify textcat event handlers
- *(bulletin-text)* Extract component
- *(bulletin-text)* Extract component
- *(bulletin-text)* Extract component
- *(authentication.service)* Simplify if
- *(authentication.service)* Inline getAccessToken
- *(create-bulletin.component)* Unused getTextcatUrl
- *(authentication.service)* Simplify if
- *(authentication.service)* Unused isInSuperRegion
- *(create-bulletin.component)* Unused isForeign
- *(authentication.service)* GetCurrentAuthorRegionIds
- *(create-bulletin.component)* Simplify if
- *(create-bulletin.component)* Unused onDangerPattern1Change
- *(create-bulletin.component)* Unused var L
- *(create-bulletin.component)* Unused fields
- *(create-bulletin.component)* Types
- *(create-bulletin.component)* Unused methods
- *(create-bulletin.component)* Simplify if
- *(create-bulletin.component)* Extract isWriteDisabled
- *(create-bulletin.component)* Simplify if in save
- *(create-bulletin.component)* Simplify if
- *(create-bulletin.component)* UpdateBulletinOnServer visibility
- *(avalanche-problem-detail)* Simplify if
- *(avalanche-problem-decision-tree)* Prefer-const
- *(avalanche-problem-icons)* Move files
- *(avalanche-problem-decision-tree)* Use (load) and [data]
- *(avalanche-problem-decision-tree)* Use HTMLElement[]
- *(regions.service)* Unused initialAggregatedRegion
- Remove unused tabs.component
- *(danger-rating-icon)* Use ?.
- *(matrix.component)* Types
- *(avalanche-problem-detail)* Unused terrainFeatureTextcat
- *(avalanche-bulletin)* String enum DangerPattern
- *(avalanche-bulletin)* Unused imports
- *(avalanche-bulletin)* String enum Tendency
- *(avalanche-bulletin)* String enum DangerRating
- *(bulletins)* Prettier
- *(models)* Prettier
- *(avalanche-bulletin)* String enum AvalancheProblem
- *(matrix)* String enum AvalancheSize
- *(matrix)* String enum SnowpackStability
- *(matrix)* String enum Frequency
- *(avalanche-problem)* String enum DangerRatingDirection
- *(matrix)* String enum DangerRatingModificator
- *(avalanche-bulletin)* String enum DangerRating
- Replace Enums.LanguageCode with string
- *(enums)* Prettier
- *(settings.service)* Unused methods
- *(settings.service)* Use translateService.currentLang
- *(settings.service)* Unused eventEmitter
- Use translateService.langs
- *(settings.service)* Simplify setLangString
- *(settings.service)* Use translateService.setTranslation
- *(authentication.service)* Rename getInternalRegions
- *(bulletin.service)* AuthenticationService.getInternalRegions
- *(authentication.service)* Prettier
- *(authentication.service)* ExternalServerLogins
- *(authentication.service)* Extract LocalStorageService
- *(base-map.service)* Use getAlbinaBaseMap
- Prettier
- *(aspects)* String enum Aspects
- *(html)* Prettier
- *(avalanche-problem)* Simplify hasAvalancheProblem
- Use Array.includes
- *(modal)* Types
- *(map.service)* Simplify onEachFeature
- *(map.service)* Simplify selectAggregatedRegion
- *(map.service)* Simplify updateAggregatedRegion
- *(map.service)* Types
- Remove unused fallback arguments
- *(map.service)* SelectAggregatedRegion0
- *(map.service)* Simplify
- Use @angular-slider/ngx-slider
- Remove unused socialmedia.service
- Remove unused breadcrumb.component
- Remove unused nav-dropdown.directive
- Remove unused aside.directive
- Remove unused sidebar.directive
- Move password-mismatch.directive
- Remove unused svg/circle_*
- Remove unused jquery-ui
- Use bootstrap modal for textcat
- Use bootstrap modal for change password
- Use bootstrap modal for update user
- Remove @angular/material
- *(observation-editor.component)* Bootstrap forms
- *(observation-table.component)* Bootstrap forms/modal
- *(observations.component)* Bootstrap dropdown checkboxes
- *(observations.component)* Bootstrap datepicker
- *(observations.component)* Bootstrap modal
- *(forecast.component)* Bootstrap dropdown checkboxes
- *(forecast.component)* Bootstrap modal
- *(avalanche-problem-decision-tree.component)* Bootstrap modal
- Remove primeng and primeicons
- Remove @angular/material
- Unused imports
- Remove obsolete package
- *(observation-api)* Index.ts
- *(constants.service)* Get rid of observationWeb constant
- *(constants.service)* Get rid of rechenraumApi constant
- *(constants.service)* Get rid of osmNominatimApi constant
- *(constants.service)* Get rid of observationApi.observed_profile constant
- *(constants.service)* Get rid of observationApi['forecast.uoa.gr'] constant
- *(constants.service)* Get rid of observationApi.multimodel constant
- *(observations.component)* Unused onSidebarChange
- *(observations.component)* Arrow callback
- *(bulletins.service)* Types
- *(constants.service)* Inline mapBoundary into observation-filter
- Locale argument of DatePipe
- Move html pipe to bulletins module
- Html pipe is pure
- Use danger-rating.component
- Remove unused window.__theme
- *(bulletins-service)* Fix Observable<Response> type
- *(awsome)* Inline template
- *(danger-rating)* Signals
- Use avalanche-problem-icons.component
- Remove unused test files
- Include observations.scss via style.scss
- Remove empty *-chart.component.scss
- *(charts)* Code duplication
- *(charts)* Extract formatTooltip
- *(observation-editor)* Reuse getDate/getTime
- *(observation-editor)* FetchElevation
- *(copy.service)* Simplify
- *(avalanche-problem-preview)* Simplify
- Simplify ngClass
- Use formatDate for ISO 8601 formatting
- *(constants.service)* Inline variables
- *(observation-filter)* Dot-notation
- *(observation-filter)* Simplify toDataset
- *(observation-filter)* Simplify toDataset
- *(observation-filter)* Simplify toDataset
- *(observation-marker)* Remove obsolete colors
- *(observation-filter)* DateRangeParams for API
- *(observation-filter)* Try DivIcon
- *(observation-chart)* Merge bar and rose
- *(observation-chart)* Rename to observation-chart
- *(observation-chart)* Move
- *(observation-marker)* Rename labelColor
- *(modal-publish-all.component)* Date
- *(modal-check.component)* Date
- *(modal-publication-status.component)* Date
- Remove discouraged enableProdMode
- Use bootstrap classes instead of inline styles
- Remove unused imports
- *(observation)* Reuse existing enums
- *(observation)* Remove unused functions
- *(observation)* Reuse existing enums
- *(observation)* Inline toObservationTable
- *(observation)* Compute tooltip when needed
- *(constants)* Compute wss:// URL
- *(observation)* Remove unused functions
- *(observation)* Reuse existing enums
- *(observations-api)* Restructure project directories
- *(stress-level)* Extract methods
- ConstantsService.getISODateString
- Use ConstantsService.getISODateString
- *(observation-filter)* Interface FilterSelectionValue
- *(observation-filter)* Simplify toggleFilter
- *(observation-filter)* Use FilterSelectionData for app-observation-chart
- *(observation-filter)* Use FilterSelectionData in app-observation-chart
- *(observation-chart)* Type Dataset, type OutputDataset
- *(observation-filter)* Use Set in FilterSelectionData
- *(observation-filter)* Use readonly in FilterSelectionData
- *(observation-filter)* FilterSelectionData.dataset
- *(observation-filter)* Unused method argument
- *(observation-chart)* Simplify event handling
- *(observation-marker)* Use FilterSelectionData for markerClassify/markerLabel
- *(observation-filter)* Use FilterSelectionData for legend text
- *(observation-filter)* Class FilterSelectionData implements FilterSelectionSpec
- *(observation-filter)* Class FilterSelectionData methods
- *(observation-filter)* Extract filter-selection-data.ts
- *(observation-filter)* FilterSelectionData: FilterSelectionData[]
- *(observation-filter)* Remove enum LocalFilterTypes
- *(observation-filter)* FilterSelectionData.setDateRange
- *(observation-filter)* FilterSelectionData.findForObservation
- *(observation-marker)* Extract make-icon.ts
- *(observation-marker)* Inline ObservationMarkerService.getIcon
- *(observation-marker)* Extract grain.shapes.ts
- *(observation-marker)* Inline const importantObservationTexts
- *(observation-chart)* FormatTooltip using bootstrap classes
- *(observation-chart)* Use bootstrap font-family
- *(url-params)* Use URLSearchParams
- *(app.component)* Simplify
- *(observations)* Simplify
- *(observations)* Extract filter-selection-data-data.ts
- *(observations)* Extract FilterSelectionData.buildChartsData
- *(observations)* Inline ObservationFilterService.buildChartsData
- *(observations)* FilterSelectionData<T> generics
- *(observations)* ObservationFilterService<T> generics
- *(observations)* FilterSelectionData.getValue
- *(observations)* ObservationMarkerService<T> generics
- *(observations)* ObservationChartComponent<T> generics
- *(awsome)* ObservationLikeProperties
- *(full-layout.component)* Remove unused disable field
- *(full-layout.component)* Remove unused status.isopen field
- *(full-layout.component)* Remove unused message field
- *(full-layout.component)* Getter for environment
- *(full-layout.component)* Remove unused toggled()
- *(awsome)* Type AwsomeSource
- *(awsome)* KeyboardEvent.key
- *(awsome)* IsMobile
- *(observation-marker.service)* Extract observation-marker-weather-station.service
- *(observation-marker.service)* Extract observation-marker-webcam.service
- *(observation-marker.service)* Extract observation-marker-observer.service
- *(observation-marker)* Default labelFont
- *(observation-table.component)* Remove unused getTableIconStyle
- Extract undo/redo to service
- *(undo-redo.service)* Move shortcut handling to avalanche-bulletin.component
- *(observations.component)* Move statistics export from admin
- Simplify boolean expressions
- *(bulletins.service)* LoadBulletins returns objects of bulletins and etag
- Convert all components, directives and pipes to standalone
- Remove unnecessary NgModule classes
- Bootstrap the application using standalone APIs
- Replace routing modules with route exports
- Use translateService.currentLang
- Remove obsolete app.module
- Init translateService in app.component
- Yarn dedupe
- Remove caaml.component and json.component
- Remove unused app.component.html
- *(observations-api)* Define snobs as own source
- *(observation-chart)* Combine onSeriesClick and onAngleAxisClick
- *(observation-chart)* Combine onSeriesClick and onClickNan
- *(observation-marker)* CreateTooltipText
- *(awsome.schema)* Reformat with prettier
- *(danger-sources)* Use bootstrap spacing classes
- *(observations-api)* Function augmentAndInsertObservation
- *(observation-editor)* Migrate to GenericObservation
- *(regions-loader)* Remove unused @eaws/micro-regions_elevation

### 📚 Documentation

- *(Readme)* Info for yarn plug'n play error

### 🎨 Styling

- *(_buttons)* Grayscale for disabled buttons

### ⚙️ Miscellaneous Tasks

- *(bulletins)* Add read only mode
- *(observations)* Color table rows
- Update .git-blame-ignore-revs
- Set lang on <body>
- *(avalanche-bulletin)* Debounce server updates
- *(avalanche-problem-decision-tree)* Cursor=pointer
- *(avalanche-problem-decision-tree)* Confirm dialog when clicking a problem
- *(bulletins)* Show copy button even if suggestions are unanswered
- *(authentication.service)* Remember active region after logout
- Ph-dots-three-outline-vertical
- *(authentication.service)* Load internal regions from API
- *(map.service)* Use ALBINA base map as WEBP
- Prettier via husky
- *(aspects)* Cursor=pointer
- Update echarts to 5.5.0
- *(bulletins-table)* Align buttons
- *(observations)* Color selected params in charts
- *(observations)* Add highlight in rose chart
- *(observations)* Introduce stacked charts
- *(observations)* Move text search to table
- *(observations)* Background gradient only in first column of table
- *(observations)* Use today as date range end for selection of days
- *(notes)* Enable notes for all (except observer)
- *(observations)* Allow revert selecting with ctrl
- *(bulletin)* SaveError per bulletin
- Use enableObservations and enableModelling
- Update to angular 17.3.2
- Yarn-deduplicate
- *(map)* Add attribution, remove opentopomap
- *(user)* Extend user model with languageCode
- *(user)* Save user language
- *(user)* Show image in table view
- *(user)* Allow to update user image
- *(i18n)* Add translation for super admin
- *(user)* Merge update and create component
- *(user)* Remove option to show/hide observations (obsolete)
- *(user)* Separate changePasswordComponent
- *(user)* Allow user to update own infos and password, remove bcrypt
- *(map.service)* Use pmtiles for aggregatedRegions
- *(map.service)* Use pmtiles for aggregatedRegions
- *(map.service)* Use pmtiles for activeSelection
- *(map.service)* Fix resetInternalAggregatedRegions
- *(bulletin-text.component)* Show notes button
- *(create-bulletin.component)* Map left/top button
- *(create-bulletin.component)* Drop getForeignRegionNames
- *(i18n)* Update translations
- *(observations)* Unwrap "more" dropdown
- Unused dependencies
- *(bulletin)* Always allow copy of texts
- *(bulletin)* Select am or pm problems if daytime removed
- *(map)* Use earlier/later
- *(create-bulletin)* Select bulletin after creation
- *(layout)* Save prefered map layout in local storage
- *(create-bulletins)* Check avalanche problem on publish, but not during copy
- *(map)* InvalidateSize for PM map only if visible
- *(avalanche-bulletin)* Open accordion if avalanche problem is created
- *(modal)* Remove animation
- *(delete)* Indicate loading of bulletins
- *(create-bulletins)* Disable buttons while loading/edit regions
- *(create-bulletins)* Emphasize save error
- *(build)* Yarn 4 using Node.js Corepack
- *(filterFeature)* Const TODAY for performance
- *(create-bulletin)* Save all altered bulletins when network is back
- *(snow-line)* Load snow line calculations
- *(observations)* Sort observations after loading
- *(snow-line)* Jump always to next diagram that is different
- *(observations)* Use imgUrl for weather stations and observers
- *(observations-api)* Snow line
- *(snow-line)* Show snow line calculations for most recent selected date
- *(observations)* Add externalImg to model
- *(observation)* Update generic observation model
- *(observations)* Filter weather stationsbased on elevation
- *(observations)* Add advanced layer control dependency
- *(observations)* Show weather station data as label (incomplete)
- *(observations)* Optional outer circle for icon
- *(weather-stations)* Add buttons to select parameters
- *(weather-stations)* Try different buttons
- *(icons)* Use phosphor icons
- *(icons)* Use phosphor icons
- *(icons)* Remove font-awesome
- *(pButton)* Remove
- Remove roboto font
- Remove material icons font
- Update to angular 18.0.1
- Update to ngx-echarts 18.0.0s
- *(login)* Add open-source Licenses list
- *(i18n)* Use tranlated strings for tooltips
- *(observations-api)* Update express
- *(observations-api)* Update mysql2
- *(observations-api)* Use json_valid in SQL
- *(create-bulletins)* Allow to compare bulletins
- *(sidebar)* Always show button on map to toggle sidebar
- *(create-bulletins)* Show number of warning regions
- *(admin)* Sort regions by name
- *(admin)* Show also region IDs
- *(observations)* Day switcher
- *(base-map)* Remove leaflet attribution prefix
- *(base-map)* Remove scale control
- *(create-bulletin)* Pointer cursor for bulletins header
- *(build)* Yarn 4.3.1
- *(create-bulletins)* Prioritze published over saved over suggested regions for coloring the map
- *(create-bulletins)* Highlight suggested micro regions of selected warning region
- *(observations)* Style dropdown buttons
- *(notes)* Disable notes
- *(weather-stations)* Label marker with weather station parameters
- *(weather-stations)* Color markers according to selected parameter
- *(weather-stations)* Add additional parameters
- *(weather-stations)* Use integer as labels
- *(weather-stations)* Add relative humidity colors
- *(weather-stations)* Add color for global radiation
- *(weather-stations)* Update icon!
- *(phosphoricons)* Update version
- Revert phosphoricons version
- Update to ngx-slider 18
- Update to phosphor-icons 2.1.1
- *(navbar)* Pointer cursor for dropdown-items
- *(observations)* Filter weather stations only by elevation
- *(observations)* Add control buttons for layers
- *(observations)* Rotate attribution, rearrange buttons
- *(observations)* Show overlay buttons only in map view
- *(observations)* Shrink weather station parameter buttons
- *(observations)* Add surface hoar to weather station parameters
- *(observations)* Add dew point to weather station parameters
- *(observations)* Show/hide observations
- *(weather-stations)* Update upper limit for coloring
- *(weather-stations)* Add surface hoar calculation by lehning
- Update to angular 18.0.6
- Update to angular 18.1.0
- *(bulletin)* Button to close textcat dialog
- *(observations)* Button to close dialog
- Update to angular 18.1.0
- Update ngx-bootstrap
- Use "longDate" format
- *(localStorage)* Save user language
- *(login)* Fix whitespace
- *(observation-editor)* Spacing
- *(validity)* Change validity to 5pm until 5pm
- *(bulletins)* Style button to load more
- *(create-bulletin)* Show error for avalanche problem, fixes #354
- *(region)* Add enableObservations and enableModelling
- *(strategic-mindset)* Add dropdown to bulletin component, add enum
- *(strategic-mindset)* Style dropdown
- *(strategic-mindset)* Add info modal, add config
- *(strategic-mindset)* Remove background colors
- *(strategic-mindset)* Prepare i18n keys
- *(strategic-mindset)* Add texts
- *(zamg-wbt)* Open link in new tab
- *(zamg-wbt)* User has to be logged in
- *(zamg-wbt)* Add config for region, add to sidebar menu, use i18n labels
- *(region-configuration)* Restructure
- *(router)* Prevent unauthorized access due to change of region2
- *(statistics)* Move to own page
- *(observations)* Allow multiple external images
- *(observations)* Add buttons for arrowUp and arrowDown
- *(observation-marker)* Memoize L.Icon for performance
- *(observation-filter)* CastArray
- *(observation-filter)* Remove unused isFilterActive
- *(observation-filter)* FilterSelectionData.values with color and label
- *(observation-filter)* Retain elevation order
- *(observation-filter)* ChartRichLabel
- *(observation-filter)* For marker color and label
- *(observation-filter)* Elevation range as label
- *(observation-filter)* ParseQueryParams 23:59:59
- *(observation-filter)* EventDate
- *(observations-api)* Astro.build init
- *(observations-api)* Astro.build
- *(observations-api)* Type GenericObservationTable
- *(observations-api)* Split astro check/build
- *(avalanche-type)* Add enum, include in avalanche problem
- *(avalanche-type)* Add button group for avalanche type
- *(avalanche-types)* Disable avalanche type for glide, wind slab and persistent weak layers
- *(observation-filter)* Filter label
- *(Sentry)* Enable and use GitLab
- *(avalanche-type)* Add type to avalanche problem preview
- *(avalanche-type)* Add style
- *(Sentry)* Enable and use GitLab
- *(create-bulletin.component)* Text-danger class
- *(build)* Enable sourcemap
- *(observation-marker)* URL.createObjectURL for performance
- *(stress-level)* I18n
- *(i18n)* Update translations
- *(stress-level)* Style
- Update to angular 18.1.3
- Yarn dedupe
- *(stress-level)* Debounce update
- *(observations)* Persist external images using line separator
- *(observations)* $externalImgs
- *(observations-api)* Astro 4.12.2
- *(stress-level)* Add to region config
- *(observations)* Rename elevation bands
- *(forecast)* Style buttons
- *(meteograms)* Load meteograms from albina server, closes #358
- VS code extensions
- *(awsome)* Add second diagram
- *(awsome)* No-cache
- *(awsome)* Iframe
- Update to angular 18.2.1
- *(stress-level)* Set diagram split number to 4!
- *(stress-level)* Introduce 4 classes, adopt color and icon
- *(danger-sources)* Add to menu, add to config
- *(danger-sources)* Add menu entry, controller, service, model (incomplete)
- *(danger-source)* Add generic map object
- *(danger-sources)* Add danger source schema (incomplete)
- *(danger-sources)* Simplify service
- *(danger-sources)* DefaultParams
- *(danger-sources)* Use URLSearchParams
- *(danger-sources)* Add return type to generic map object
- *(danger-sources)* Implement view (incomplete)
- *(danger-rating-icon)* Change input variables
- *(matrix-information)* Do not use setters in constructor!
- *(danger-sources)* Extend danger source logic
- *(danger-sources)* Implement save/load for danger sources and variants
- *(danger-sources)* Add shared module, fix load from yesterday
- *(danger-sources)* Set active variant after create
- *(danger-sources)* Extend danger source variant component
- *(danger-sources)* Add glidingSnowActivityValue, rename status to dangerSourceVariantStatus
- *(danger-sources)* Add parameter to danger source variant view
- *(danger-sources)* Update i18n strings
- *(danger-sources)* Add parameter to view, update i18n strings
- *(danger-sources)* Add properties to variant gui
- *(danger-sources)* Add infos to headers, edit danger source modal
- *(danger-sources)* Update status texts
- *(danger-sources)* Update danger source method
- *(danger-sources)* Disable compared variant
- *(danger-sources)* Create internal danger source and variants at once
- *(danger-sources)* Sort variants by danger rating
- *(danger-sources)* Add danger source title to variant header
- *(danger-sources)* Add status and make it editable
- *(danger-sources)* Sort variants to update map correctly
- *(danger-sources)* Show status of variant and make it editable
- *(danger-sources)* Add danger source variant type, load status
- *(danger-sources)* Add forecast/analysis differentiation
- *(danger-sources)* Show type below date in create danger sources view
- *(danger-sources)* Compare forecast with analysis
- *(vs-code)* Add i18n ally to extension recommendations
- *(grain-shapes)* Add codes and descriptions to translation files
- *(danger-sources)* Put label in own row
- *(danger-sources)* Use checkboxes for all parameter
- *(danger-sources)* Use full width for slab hand hardness
- *(awsome)* Update source url
- Update to angular 18.2.2
- *(build)* Yarn 4.4.1
- *(awsome)* Auto-aspects only if snp_characteristics
- *(undo-redo.service)* Debounce server update after undo/redo
- *(undo-redo.service)* Flush server update before undo/redo
- *(i18n)* Add missing create.tooltip.treeline
- *(awsome)* No caching for GeoJSON
- Update to angular 19.0.0-next.8
- *(i18n)* Update translations
- Update awsome.json
- Update protomaps-leaflet
- *(observations)* Btn-close for close button
- *(forecast)* Btn-close for close button
- Update to angular 19.0.0-next.13
- Update protomaps-leaflet (@mapbox/point-geometry)
- *(observations-api)* Refetch after 300s
- Update to angular 19.0.0-rc.0
- Update to angular-eslint 18.4.0
- Update to angular 19.0.0-rc.1

### Refac

- *(danger-sources)* Rename originalDangerSourceVariantId

## [6.1.0] - 2024-02-21

### 🚀 Features

- *(observation)* Add lolaCommissionEvaluation
- *(login)* Set document title and server version
- *(observations)* Marker color by stability
- *(observations)* Label and classify
- *(observations)* Authenticated API calls
- *(observations)* Private.foto-webcam.eu
- *(regions)* Add SK add PL-12
- *(regions)* Load async
- *(alpsolut_profile)* Various intervals
- *(modelling)* Split geosphere/snowpack
- Enable snowpack/awesome w/o login
- *(observations)* Add ras.bz.it webcams
- Add panocloud webcams via it-wms.com
- *(observations-api)* Bun.serve
- *(observations-api)* LastFetch for fetchAndInsert
- *(observations-api)* Fetch webcams
- *(observations-api)* Fetch AWS observers
- *(observation-table)* Use snowsymbolsiacs
- *(create-bulletin)* Show alert/warning if bulletins could not be saved/loaded
- *(observations)* Use chart as legend for classify
- *(observations)* Add legend for label (incomplete)
- *(observations)* Add label to charts
- *(observations)* Define snobs as own source
- *(compare)* Allow to compare bulletins (deactivated)
- *(observations-api)* Fetch AWS weather stations
- *(observations)* Add AWS weather stations overlay
- *(observations)* Arrow left/right for weather stations
- *(observations)* Load lola obs without login

### 🐛 Bug Fixes

- *(angular)* Drop max budget config
- *(eslint)* Update tsconfig.json
- *(observations)* Scrolling
- *(observations)* Lola-kronos external URLs
- *(server.model)* Correctly deserialize regions
- *(external-server)* Do not exclude AT-07
- *(observations)* LoadAll
- *(gitlab-ci)* Typo
- Remove broken SentryErrorHandler!
- *(forecast)* AugmentRegion
- Header to big. #296
- *(region-menu)* Allow download json always, upload json and load yesterday only if editable
- *(avatar)* Show image in warning region header
- *(am/pm)* Disable input if not editable
- *(education)* Extend div§
- *(create-bulletin)* Publication info
- *(change)* Reintroduce seperate change method in BulletinService
- *(publication-info)* Do not show two infos
- *(aps)* Show + for problems only if editable
- *(disabled)* Notes and copy textcat
- *(map)* Select warning region with click on map
- *(cop)* Stop listening on destroy
- *(event)* Ignore dev tool messages
- *(i18n)* Typo
- *(bulletins-service)* Improve log
- *(create-bulletins)* Typo
- *(copy)* Show modal to choose micro regions
- *(copy)* Pass event
- *(map)* Sync am/pm maps
- *(am-pm)* Always show double map in case of daytime dependency of day
- *(am-pm)* Am/pm controls
- *(publication)* Do not update if status submitted
- *(ap)* Extend danger level only for first avalanche problem
- *(ws-update)* Check status map
- *(suggestions)* Do not allow suggestions within owner area
- *(external-servers)* Remove duplicate entries
- *(matrix)* Minus modificator
- *(matrix)* Padding of headline
- *(aps)* Decision tree link and feedback
- *(ap)* Do not show matrix parameter twice
- *(copy)* Allow paste to same day
- *(elevation)* Do not update if elevation checkbox is checked
- *(elevation)* Harmonize inputs
- *(map)* Highlight selected region in map after update
- *(map)* Invalidate size
- *(observations-api)* Missing await
- *(observations-api)* Aspect
- *(observations-api)* 3600e3
- *(observations-api)* [""]
- *(observations-api)* Lawis details
- AugmentRegion for ALBINA observations
- *(external-bulletins)* Load only if regions are not edited
- *(map-service)* Check for undefined
- *(create-bulletin)* Delete obsolete parts
- *(regions)* Show region names for saved and published regions
- *(texts)* Update texts when selected region changes
- *(translations)* Use full width for translation textareas
- Check for null
- *(observations-map)* Height
- *(danger-source)* Remove model
- *(create-bulletins)* Do not update active bulletin when loaded from server
- *(map-service)* Do not update map multiple times
- *(create-bulletin)* Keep editing regions after noRegion error
- *(observation-filter)* Aspects rose-chart is red
- *(external-server)* Check login status of external servers
- *(observation-map)* InvalidateSize
- *(observations)* Color active classify and label type
- *(observations)* Reintroduce coloring of reset and invert buttons
- *(notes)* Bind to correct data field
- *(aps)* Do not check aps on select/deselect
- *(observations)* Use snowLine as elevation for simple observations
- Yarn.lock
- *(observations)* Table html

### 🚜 Refactor

- Yarn-deduplicate
- Replace papaparse with custom parsing
- *(modelling)* Migrate to standalone API
- *(modelling)* Use standalone API in routing
- *(observations)* Migrate to standalone API
- *(observations)* Prettier
- *(modelling)* Prettier
- Extract aws-observer
- Extract foto-webcam.model
- Extract panomax.model
- *(modelling)* MultiselectDropdownData.loader
- *(modelling)* Split huge ModellingService
- *(modelling)* Split huge ModellingService
- *(qfa)* Move to src/app/modelling/qfa
- *(qfa)* Move to src/app/modelling/qfa
- Use @eaws/micro-regions
- Observations/sources
- *(observations)* Split huge ObservationsService
- Consistent-type-imports, sort-imports
- *(observations)* ObservationMarkerService
- *(observations)* Prettier
- *(observations)* RegionsService.augmentRegion
- *(observations)* CreateMarker
- *(observations)* MarkerService.createMarker
- *(observations)* MarkerService.createTooltip
- *(observations)* MarkerService.style
- *(observation)* No TranslationFunction
- Base-chart.component
- Base-chart.component.html
- *(observation/charts)* Move files
- Move API URLs to constants.service
- Remove matrix-obsolete.component
- *(multimodel)* Use regionsService.augmentRegion
- *(alpsolut_profile)* Remove unused interface AlpsolutFeature
- Extract AmPmControl
- Extract MapService.initAmPmMap
- *(map.service)* Private onEachFeature
- *(map.service)* Private onEachFeature
- *(map.service)* Private initOverlayMaps
- *(modules)* Map services where needed
- *(app.module)* Remove ObservationsService
- *(modelling)* Remove obsolete index.component
- *(debugger)* Remove statements
- RegionsService
- MergeFeatureCollections
- Types
- Async function* fetchAll
- Types
- Remove obsolete keys from RegionProperties
- Use regionsService.getActiveRegion
- Use Array<string[]>.find
- Use aggregatedRegions for initialAggregatedRegion
- Async getRegionsEuregio
- Remove unused imports
- Async function
- Import mergeFeatureCollections
- Cache loadRegionsEuregio
- OnRegionsDropdownSelect, onSourcesDropdownSelect
- [(ngModel)]="filter.observationSources"
- No special handling for FotoWebcamsEU needed
- *(create-bulletin)* Remove debugging statements
- *(create-bulletin)* Rename editBulletin -> editMicroRegions
- *(create-bulletin)* Remove obsolete code
- *(create-bulletin)* Remove unused imports
- *(map-service)* Add comment
- *(create-bulletin)* Simplify modal method calls
- *(create-bulletin)* Comments in en
- *(ap)* Remove console output
- Process.env.WIKISNOW_API
- Process.env.LOLA_KRONOS_API_TOKEN
- *(observations-api)* StartDate and endDate
- *(observations-api)* Types
- *(observations-api)* Migrate to express
- *(observations-api)* Process.env.PORT
- *(observations-api)* Function findExistingObservation
- *(observations-api)* Specify main in package.json
- Observations-api/models
- Remove/inline ObservationsService
- Move observations.service.ts
- MarkerService.createCircleMarker
- Use mapService.addMarker
- *(observations-api)* Use await fetchJSON
- *(observation-table)* Remove obsolete source/type filtering
- *(observation-table)* ShownObservations
- *(observation-table)* Unused variables
- *(observation-filter)* Object.keys
- Remove unused ngx-leaflet
- *(map-service)* Simplify
- *(create-bulletin)* Add break in loops
- *(map)* Delete obsolete parameter
- *(create-bulletin)* Remove unused imports
- *(map)* Edit selection
- *(map-service)* Simplify map handling
- *(create-bulletin)* Delete obsolete method
- *(observations)* Prefer-includes
- *(observations)* Prefer-const
- *(observations)* Boolean→boolean
- *(observations)* IsFilterActive
- *(observation-filter)* SeedFilterSelectionsAll
- *(observation-filter)* ToDataset
- *(observation-filter)* FilterSelectionData.type
- *(observation-filter)* ToDataset
- *(observation-filter)* NormalizeData
- *(observation-filter)* ToDataset
- *(observation-filter)* IsSelected/isHighlighted
- *(observation-filter)* _normedDateString
- *(observation-filter)* GetElevationIndex
- *(observation-filter)* GetISODateString
- *(observation-filter)* Reverse sorting
- *(observation/charts)* Same type for handleChange/toggleFilter
- *(observation)* Use type EChartsOption
- *(observation-filter)* GetISODateString
- *(observation)* *ngFor="let type of barCharts"
- *(observation-filter)* IsSelected/isHighlighted
- *(observations)* FilterType/isHighlighted
- *(observations)* *ngIf="layout === 'table'"
- *(observation-filter)* Prettier
- *(text.model)* Type LangTexts for avActivityComment
- *(observations-api)* No datejs
- *(observations-api)* Do not augment elevation
- *(observations)* Prettier
- *(observations)* Typeof mapService.layers
- *(observations)* LoadGenericObservations0
- *(observations)* Remove unused variable

### ⚡ Performance

- *(map.service)* Avoid early init

### ⚙️ Miscellaneous Tasks

- *(observations)* Remove obsolete sources, fixes #288
- Update to angular 16.2
- Delete obsolete angular-cli.json
- Update ngx-echarts
- Update primeng
- Update .git-blame-ignore-revs
- Update ngx-leaflet
- Update ngx-bootstrap
- Upgrade to angular 17.0
- Update ngx-leaflet
- Update ngx-echarts
- Prettier 3.1.0
- Update .git-blame-ignore-revs
- *(observations)* Validate scheme using zod
- *(modelling)* New API salient.alpsolut.eu
- *(observations)* Lola-kronos stability
- *(observations)* Better markerService.colors
- *(observations)* Lola-kronos snowStabilityTest
- *(observations)* New marker icon
- *(observations)* EnumArrayColor
- Add snowsymbolsiacs
- *(observations)* ImportantObservationTexts
- Yarn dev
- Lola avalanches are Stability.very_poor
- *(observation/charts)* Use fontawesome icons
- *(observations)* Lola-kronos snowStabilityTest
- *(lawis-model)* Add RB stability classification
- *(observations)* Allow deactivating of classify and label
- Use xlink:href for avalanche problem icons
- Compress svg using svgo
- Update to angular 17.1.0-next
- *(env)* Add additional parameters to env
- *(chat)* Remove chat completely
- *(small-change)* Move differentiation between update and small change to publication method
- *(bulletin-table)* Move info button to end
- *(bulletins-service)* Update isPast method -> hasBeenPublished
- *(update)* Save draft immediately
- *(create-bulletin)* Remove isUpdate, set isEditable
- *(auto-save)* Enable automatic saving
- *(auto-save)* Only if warning region was created
- *(submit)* Check avalanche problems
- *(warning-region)* Show only first micro region in title
- *(auto-save)* Longer interval, save before submit
- *(region-buttons)* StopPropagation, dummy method for compare
- *(i18n)* Add missing translations
- *(am/pm)* Disable input if foreign region
- *(pdf-preview)* Move to createBulletinsComponent
- *(publication)* Switch icon
- *(user-image)* Do not show image
- *(control-buttons)* Move from able view to createBulletinComponent
- *(locking)* Remove region locks, add bulletin locks (not active)
- *(auto-save)* Save only own regions (published, saved)
- *(bulletin-saving)* Add methods to create, update, delete single bulletins
- *(build)* Add local env
- *(bulletin)* Use pmData.textDe_AT
- Remove legacy snowpack views
- Environment.isEuregio
- *(env)* Change color for env local
- *(copy)* Create draft after pasting bulletins from another date
- *(regions)* Show foreign and external regions, allow to hide them
- *(regions)* Show region name instead of
- *(regions)* Show correct banners in region view
- *(lola-kronos)* Avalanche problems for avalanche events
- Load fast observations first
- *(observation-table)* Hide webcams
- *(observation-table)* Region name as tooltip
- *(create-bulletin)* Encode date in url
- *(external-bulletins)* Structure
- *(external-servers)* Use correct server names
- *(create-bulletin)* Improve loading message
- *(am-pm)* Simplify change
- *(map)* Allow selection of suggested micro regions in map
- *(save)* Implement create, update, delete methods
- *(save)* Set validFrom and validUntil before saving
- *(save)* Do not save external regions
- *(map)* Center map after regions edit
- *(save)* Submit, ngOnDestroy, changeDate
- *(tendency)* Remove sub headline
- *(save)* Add trigger
- *(save)* Remove save button div
- *(ap)* Do not open first avalanche problem
- *(copy)* Use table view to copy
- *(style)* Emphasize own regions
- *(i18n)* Change string for update
- *(bulletin)* Define texts and buttons in info bar
- *(bulletin)* Show edit micro regions for foreign regions
- *(ap)* Hide delete button if disabled
- *(regions)* Toggle region list with header element
- *(foreign-regions)* Rename to province names
- *(compare)* Hide button, not implemented yet
- *(external-bulletins)* Load external bulletins with timer, extract methods, cut map operations
- *(env)* Update colors and logos for environments
- *(external-bulletins)* Delay api calls
- *(save)* Change notes, change danger pattern, do not goBack on save error
- *(save)* Automatically save active bulletin on change
- *(am-pm)* Move button to info bar, allow adding pm problems
- *(aps)* Do not show delete button if disabled
- *(map)* Do not invalidate size
- *(full-layout)* Allow change of region within bulletin
- *(create-bulletin)* Save changes instantly on server
- *(media-file)* Show button independent of bulletin status
- *(publish/submit)* Show info texts
- *(submit/publish)* Add translations
- *(create-bulletin)* Update internal bulletins regularely
- *(create-bulletin)* Use same icon for menu
- *(create-bulletin)* Reload only internal aggregated regions in map
- *(create-bulletin)* Update only internal aggregated regions in map
- *(create-bulletin)* Use pencil icon to edit cop
- *(notes)* Allow show/hide notes
- *(create-bulletin)* Add divider in bulletin menu
- *(am-pm)* Update maps after loading internal bulletins
- *(am-pm)* Use two lines in region list if am/pm
- *(create-bulletin)* Shrink textfields for headline and tendency
- *(observations-api)* README
- *(observations-api)* Bun build
- *(observations-api)* Check Response.ok
- *(observations-api)* Avoid Array.fromAsync
- *(observations-api)* Augment elevation using voibos.rechenraum.com
- *(observations-api)* Specify startDate/endDate for fetchAndInsert
- *(observations-api)* ?? undefined
- *(observations-api)* Skip existing lawis.at
- *(observations-api)* Fetch elevation only if lat/lng changed
- *(observations-api)* REPLACE INTO
- *(observations.service)* Fetch from observations-api
- *(observations)* Load webcams into separate overlay
- *(observations)* Disable lola-cads.info for performance
- *(observations.service)* Fetch webcams from observations-api
- *(observations)* Load observers into separate overlay
- Try markerPane for webcam markers
- Reuse markerService.createMarker for webcams
- *(observations-api)* Private.foto-webcam.eu.json
- @angular/material:mdc-migration
- Update to angular 17.1.1
- Yarn-deduplicate
- Update to primeng 17.4.0
- *(map)* Color selected regions always the same
- *(avalanche-bulletin)* Create avalanche bulletin component
- *(regions)* Change pointer
- *(i18n)* Update translations
- *(map)* Do not run invalidateSize
- *(map-service)* Simplify region style
- *(tendency)* Shrink buttons
- *(map-service)* Use editSelection layer only in map
- *(env)* Change env color
- *(create-bulletin)* Update active bulletin if isDisabled
- *(fav-icons)* Update icons for dev env
- *(button)* Remove border for textcat buttons if disabled
- *(decision-tree)* Show only if enabled
- *(scss)* Show region buttons always
- *(scss)* Show buttons in table view always
- *(observations)* Exlude time series and webcams from filters
- *(observations)* Toggle filters in header
- *(observations)* Do not show webcams and observers as sources
- *(base-chart)* Always show number non defined
- *(observations)* Shorten important observation headline
- *(observations)* Show only black charts
- *(texts)* Use bulletin texts directly
- *(invalidateSize)* Reintroduce
- *(observations)* Exclude cornice, no distinct and favourable situation from filter
- *(observations)* Update colors for elevation
- *(observations)* Add icons for important observations
- *(observations)* Update label for important observations
- *(observations)* Colors for aspect and avalanche problem
- *(observations)* Make label in rose charts clickable
- *(observations)* Show #observations without parameter
- *(observations)* Update colors for avalanche problems
- *(observations-api)* $extraDialogRows
- *(compare)* Hide button to compare bulletins
- Update to angular 17.2.1
- Update ngx-bootstrap
- Update to ngx-translate 15
- *(observation-table)* Multiline
- *(observations)* Duplicate simple observations with snowline (use different elevations)
- *(observations)* Simplify table header
- *(observations)* Use uniform global filters
- *(observations)* Set max-width for table column
- *(create-bulletins)* Get bulletins as return value after update/create/delete

### Observations-api

- Lawis
- Lawis
- Lola-kronos
- Wikisnow
- Lwdkip
- Lawis

## [6.0.1] - 2023-11-21

### ⚙️ Miscellaneous Tasks

- *(i18n)* Update translations

## [6.0.0] - 2023-11-14

### 🚀 Features

- *(forecasts)* Switch between Alpsolut configs
- *(observation)* Fix webcams and add aspect to webcams
- *(observation)* Fetch webcam images in hd
- *(observation)* Use complete interface of foto-webcam.eu in iframe
- *(observation)* Automatically fetch height for all observations in Austria
- *(observation)* Automatically set input fields for stability, importantObservation, dp, avalancheProblem
- *(observation)* Automatically set eventType=Avalanche for Leitstelle Tirol incident
- *(observation)* Add panomax webcams
- *(observation)* Check if avalanches are on webcam images and classify them as avalanches
- *(observation)* Fetch slope and aspect of observation
- *(observation)* Read aspect and slope angle from input coordinates
- *(observation)* Add lola-cads to foto-webcam.eu and remove it from panomax
- *(observation)* Add confidence and type to observation name
- @angular-devkit/build-angular:browser
- Login page
- Add methods for the next and previous dates to the bulletins service
- Import all necessary bootstrap components.
- *(bulletins)* Load bulletins by date
- *(bulletins)* Show region names (short|long format)
- *(bulletins)* Make checkbox labels clickable
- *(bulletins)* Create reusable avalanche problem icon component
- *(bulletins)* Don't navigate to home after saving bulletin.
- *(bulletins)* Add new and update i18n string for german.
- *(bulletins)* Sidebar dropdown menu.
- *(bulletins)* Region form layout toggler between compact and default view.
- *(bulletins)* Unique ids for checkbox labels.
- *(bulletins)* Responsive form layout.
- *(bulletins)* Add footers to all modals.
- *(bulletins)* Toggle chat.
- *(bulletins)* Edit region.
- *(bulletins)* Move publishing tools to bulletin.

### 🐛 Bug Fixes

- *(modelling)* ECMWF+CLAEF HN+HS
- *(forecast)* Limit select width for mobile
- *(observation)* Filter all cams with no region to fix filter
- *(observation)* Fix observation parsing for #-fields
- *(observation)* Really remove aspects of 360 degree panomax cams
- *(observation)* REALLY remove aspects of 360 degree panomax cams
- *(observation)* Fix minor issues with latitude and longitude
- *(observation)* Fix issue with negative aspect
- *(observation)* Fix issue with rounding up to north sector
- *(observations)* Remove duplicate observations
- *(observation)* Fix duplicate observations showing up
- *(observation)* Remove duplicates from ObservationSource.AvalancheWarningService
- Logo.png in scss
- Disable ngx-slider for now
- Zone.js
- TypeScript errors
- Use danisss9/ngx-slider
- Vendor danisss9/ngx-slider
- @angular-eslint/template/eqeqeq
- Eslint-disable-next-line @angular-eslint/no-host-metadata-property
- *(typo)* PROPDUCTION --> PRODUCTION
- Development in README
- *(admin)* Loading on first visit

### 🚜 Refactor

- *(observations)* ObservationSource.LoLaKronos
- *(observation)* Export elevation api url to constantsService
- *(observation)* Remove console.log
- *(observation)* Create service to fetch aspect and sloep
- Setup basic scss folder structure

### ⚙️ Miscellaneous Tasks

- *(map.service)* Always use static.avalanche.report/tms
- *(observations)* Add reportDate to table
- *(observations)* Combine observation types avalanche and incident
- *(i18n)* Add translation for webcam
- *(observation)* Add button to copy coordinates
- *(observation)* Remove aspect from 360 degree panomax cams
- *(webcams)* Use admin.avalanche.report as proxy
- *(observation)* Remove console.log statements
- *(observation)* Undbind foto-webcam from loading
- Remove console.log
- *(observation)* Do not set aspect automatically for newly entered observation
- Upgrade to angular 14.2
- Upgrade to angular/material 14.2
- Update to ngx-bootstrap 9
- Update to primeng 14
- Update to ngx-leaflet 14
- Upgrade to angular 15.0
- Upgrade to angular/material 15.0
- Update to primeng 15
- Update to @sentry/angular 7.21
- Last 2 Chrome/Firefox versions
- Add yarn.lock
- Upgrade to angular 16.0
- Update asymmetrik/ngx-leaflet
- Update ngx-bootstrap
- Update ngx-echarts
- No analytics
- Syncyarnlock
- Update primeflex
- *(complexity)* Remove obsolete components
- Upgrade bootstrap 4 to 5.3
- Install phosphoricons
- *(publication-status)* Remove test methods, remove staticWidget
- *(observations)* Remove lola-safety
- *(modelling)* Remove snowgridmultimodel
- *(modelling)* Remove snowgridmultimodel_modprog1400_HN

### Wip

- Migrate scss to bootstrap 5
- *(bulletins)* Layout list view.
- New navbar.
- *(bulletins)* Create view.
- *(bulletins)* Implement new design
- Adapt navbar to new design
- Preview of new layout
- Create-bulletin styles.
- *(bulletins)* New layout.
- *(bulletins)* Copy regions.

## [5.1.0] - 2023-02-13

### 🚀 Features

- New svg icon for observations
- *(observations)* Good tooltips
- *(observations)* Add models.avalanche.report
- *(modelling)* Added base card, added drawMarker function
- *(modelling)* Added zamgModelPoints to map
- *(modelling)* Add all zamg model points
- *(modelling)* Add qfa points to map
- *(modelling)* Allow layers to be selected
- *(modelling)* Display models on click on point
- *(modelling)* Display latest qfa run
- *(modelling)* Added dropdown for selection of model points
- *(modelling)* Add dropdown for qfa + add offset for eps_claef
- *(qfa, modelling)* Add buttons to switch between days of qfa
- *(qfa)* File selection via arrow keys
- *(modelling)* Select area via arrow keys
- *(observations)* Toggle filters
- *(observations)* Toggle map/table
- *(observations)* Table+filter layout
- *(observations)* Sortable table
- *(observations)* Global filter for table
- *(observations)* Show important observation in table
- *(forecast)* Migrate to observations layout
- *(forecast)* Map legend
- *(forecast)* Add observed snow profiles
- *(forecast)* Add tooltips for every model point
- *(forecast)* Add loader icon
- *(forecast)* Enable reloading and show only selected sources on reload
- *(forecast)* Make forecast popup span the whole screen by default, fixes #250
- *(forecast)* Add Alpsolut dashboard
- *(observations)* Add Salzburg and Vorarlberg
- *(forecasts)* All Alpsolut dashboard
- *(observation)* Copy lat lng coordinates to clipboard
- *(observation)* Fetch elevation from coordinates and round to 10, fixes #260 and #256
- *(observations)* Add webcams from foto-webcam.eu to observations
- *(observation)* Copy coordinates to clipboard if they change
- *(observation)* Copy coordinates to clipboard if they change
- *(forecast)* Add swiping on mobile (fixes #254)
- *(forecast)* Improved filtering for sources and added regional filter
- *(forecast)* Add region-multiselect
- *(forecast)* Change defaultConfiguration, fixes #254
- *(forecasts)* GenericObservation
- *(forecasts)* GenericObservation
- *(observations)* Prev/next via arrow keys
- *(forecasts)* Add GeoSphere meteograms

### 🐛 Bug Fixes

- *(observations)* IsSelected, isHighlighted
- *(observations)* ImportantObservation
- Typo
- *(map)* Don't display observations on modelling maps
- *(modelling)* Add missing layer
- *(modelling)* Add changes from #57742855f4105c6f30c426b055c47ee8e1033cec
- *(observation)* Apply changes from #1a26f1083bf7d1798e2bf4609a1b61613daae679 in observation-map
- *(observation)* Apply changes from #1a26f1083bf7d1798e2bf4609a1b61613daae679 in observation-map
- *(forecast)* Fix typing
- *(observations)* Date picker z-index
- *(observations)* Selected/all count!
- *(forecast)* Remove observation layers
- *(observation-map)* MarkerRadius!
- *(forecast)* Dust parameters are displayed again
- *(forecast)* Display dust params only on the latest run
- *(dust-params)* Fixes #247
- *(forecast)* Focus on select to not move map with arrow keys, fixes #249
- *(observation)* Remove connection between filter and sources
- *(observation)* Convert webcam array to object
- Duplicate of enum in GenericObservation model
- AngularCompilerOptions.strictTemplates is too strict

### 🚜 Refactor

- *(observations)* Prettier
- *(observations)* Prettier
- *(modelling)* Snowgridmultimodel_stationlist
- *(base-map)* Change callback format
- *(forecast)* Make callback functions more readable
- Typing
- Format observations.min.css
- *(qfa)* Document caddy JSON directory index
- *(observation)* Remove $markerRadius field
- *(observation)* Remove ObservationTypeIcons
- *(forecast)* Service
- Obsolete mapService.observationSourceLayers
- *(observations)* Obsolete ObservationSourceColors
- *(observations)* ObservationApi.AvaObs
- *(observations)* ObservationWeb
- *(observations)* Prettier
- *(forecast)* File structure
- *(forecast)* Type QfaResult
- *(observations)* Cleanup code
- Remove unused leaflet-sidebar-v2

### 🎨 Styling

- *(forecast)* Restructure buttons
- *(forecast)* Improve style of control note

### ⚙️ Miscellaneous Tasks

- *(stability)* Update stability classes
- *(observations)* Select source only filters observations
- *(observations)* Restructure sources and types, add chart for types
- *(observations)* Add bar charts
- Removed console.log of regex
- Enable Prettier
- *(observations)* Label = source+type
- *(qfa-map)* Add region features to qfa-map-service (copy from observations-map-service
- *(map)* One map-service for models, observations and qfa
- *(map)* Add regions to zamg models
- *(i18n)* Added translation for qfa parameters
- *(i18n)* Added translation for dust parameter
- *(qfa)* Remove old qfa components
- *(qfa)* Remove old qfa components
- *(modelling)* Rename dropdown options for qfa
- *(modelling)* Restructured files (forecast)
- *(modelling)* Restructured files (forecast)
- *(modelling)* Changed file structure
- *(forecast)* Add lat offset to see marker
- *(env)* Change environment and angular config for produciton
- *(modelling)* Merge master into qfa and resolve merge conflicts
- *(forecast)* Remove redundant coordinates of qfa
- Add .git-blame-ignore-revs
- *(observation-table)* Hide icon column
- *(observations)* Omit table button line
- *(observations)* Very good table padding
- *(observations)* Enable i18n
- *(i18n)* Update translations
- *(observations)* Increase p-multiselect height
- *(observations)* Move table filter to global-bar
- *(forecast)* Add info tooltip
- *(env)* Change baseurl to dev-server
- *(env)* Change baseurl to dev-server
- *(observations)* Fetch details with low priority
- *(forecast)* Display keyboard shortcuts
- *(forecast)* Translate forecast sources
- *(forecast)* AvalancheWarningServiceObservedProfiles as ZamgModelPoint
- *(i18n)* But unites in brackets
- *(i18n)* Use interpolation parameters for qfa parameters
- *(dust-service)* Improved typing of dust parameters
- *(forecast)* Wait for dust params to load before adding markers to map
- *(forecast)* Reuse allSources to build fullModelNames
- *(forecast)* Good tooltips
- *(forecast)* Dialog title
- *(forecast)* Layer attribution
- *(nav)* Skip modelling index, go to forecasts
- *(forecast)* Displacement for eps_ecmwf
- *(observation)* Set elevation whenever coords change
- *(observation)* Set elevation whenever coords change
- *(observation)* Use DTM instead of DSM
- *(observation)* Add real time of webcam picture
- *(forecast)* Change CircleMarkers to Markers
- *(forecast)* Try to add regional filter
- *(forecast)* Unify drawing of modelPoints and QFA
- *(forecast)* Change environment back to development and hoping that pipeline succeeds
- *(forecast)* Env production??
- Max_line_length = 120
- *(forecast)* Better Alpsolut ordering
- *(forecast)* Region for observed_profiles
- *(i18n)* Update translations

## [5.0.4] - 2023-01-05

### 🚀 Features

- *(qfa-file-model)* Added dustload fetching
- Get dust parameters of each city
- Added DUST param to table
- Seperate DUST parameter from others
- Show first run on startup (quick&dirty)
- Added missing param service
- *(observation)* Show avalanche problem in table
- *(observation)* Preload eventDate and reportDate
- *(observations-time)* Fixed time and date saving in observations object and send to server
- *(zamg-models)* Add CLAEF-EPS
- *(modelling)* Add index to declutter navbar

### 🐛 Bug Fixes

- Changed url to dust-site
- Fixed extraction of image pixel
- Added dust.service and fixed colorization of params
- Remove dust param for old runs
- Delayed loading from dust parameters
- Bug when changing dates and reselecting run
- Fixed that first city selected is always selected
- Fixed dust params, only innsbruck was visible
- *(package.json)* Delete unused package node-fetch
- Removed backslash from navbar
- *(observation)* Ignore null dangerPattern
- *(observation)* Table shows all obs at 00:00
- *(aineva)* Add old problem structure to json export

### 🚜 Refactor

- Move loading of dust params to service
- Moved parameter classes to own service
- Use eaws-regions as node module

### ⚙️ Miscellaneous Tasks

- Removed console.log statements & changed apiBaseUrl
- Changed compilation to match main
- *(observations)* Multiple dangerPatterns
- GenericObservation<IncidentDetails>
- GenericObservation<ProfileDetails>
- *(observations)* Multiple avalancheProblems
- *(lawis)* AvalancheProblems for incidents
- *(lola-kronos)* AvalancheProblems
- *(observations)* String enum AvalancheProblem
- *(observation-editor)* Changed report and event date input
- (observations-time): restore default environment
- *(i18n)* Update translations
- Rename "qfa"
- Remove "qfa" from navbar
- *(i18n)* Update translations
- *(media-file)* Text not compulsory anymore

## [5.0.3] - 2022-11-23

### 🐛 Bug Fixes

- *(matrix)* Enable/disable slider correct
- *(package)* Start-dev
- *(observations.service)* BEOBDATUM TIMESTAMP
- *(sentry)* Observe.gitlab.com

### 🚜 Refactor

- Clear typings.d.ts

## [5.0.2] - 2022-11-09

### 🚀 Features

- Load environment variables via assets/env.js

### 🐛 Bug Fixes

- Static.avalanche.report/tms
- *(danger-rating)* Height in px
- *(matrix-parameter)* Disable slider if bulletin is not editable
- Regenerate yarn.lock
- Ng budgets
- Ng budgets (1gb should be fine)
- Ng lint
- *(danger-rating-icon)* Define height
- *(observer)* Do not create initial region
- *(ap-preview)* Show ap icon
- *(package)* Restore start-dev

### 🚜 Refactor

- Extract function enableSentry
- Type TranslationFunction
- *(GenericObservation)* $extraDialogRows type
- *(GenericObservation)* Jsdoc
- *(rxjs)* Use Observable.pipe
- Remove obsolete rebuild node-sass
- Simplify angular.json

### ⚙️ Miscellaneous Tasks

- *(i18n)* Update translations
- *(i18n)* Update translations
- *(i18n)* Update translations
- *(observations)* Use current date
- *(observations)* Allow saving only with complete reportDate and eventDate
- *(observations)* Create observation in table header§

### Observations

- Highlight in table
- Added counter for selected observations

## [5.0.1] - 2022-09-07

### 🚜 Refactor

- *(regions.service)* InitialAggregatedRegion

### ⚙️ Miscellaneous Tasks

- *(eaws-regions)* Update regions
- *(eaws-regions)* Update regions
- *(regions.service)* Valid on 2022-12-01
- *(regions)* Add new micro regions
- *(eaws-regions)* Update version
- *(i18n)* Fix translation error#
- *(matrix)* Normalize sliders to 100 max.
- *(i18n)* Update translations
- *(i18n)* Add travel advice categories
- *(danger-rating)* Add all subclasses -, =, +
- *(isMarkerInsidePolygon)* Support MultiPolygon
- *(avalanche-problem)* Make cornices and no distinct problem optional

### Pref

- *(regions.service)* @ts-ignore for eaws-regions

## [5.0.0] - 2022-07-02

### 🐛 Bug Fixes

- *(observation-table)* $markerColor
- *(statistics)* Add providers
- *(create-bulletin)* Init arrays
- *(external-servers)* Load from local storage
- *(external-servers)* Load from local storage
- *(create-bulletin)* Remove debugger statement
- Remove debugger statements
- *(i18n)* Translation keys
- *(config)* Add media path to server config, fix input ids
- *(init-region)* Show initial region on map
- *(region-lock)* Use correct region id
- *(bulletin-service)* Fix date range
- *(build)* NODE_OPTIONS=--max-old-space-size=4096
- *(bulletins)* Show correct status of all bulletins
- *(matrix)* Calculation of matrix cell
- Map coloring depending on elevation

### 🚜 Refactor

- Remove unused import
- *(comment)* Remove
- *(region)* Remove obsolete loading flags
- *(avalanche-problem)* Rename avalanche situation to avalanche problem
- Delete bulletin detail component
- *(settings)* Remove useMatrix setting (obsolete matrix)
- Remove obsolete code
- Remove obsolete code

### ⚙️ Miscellaneous Tasks

- *(layout)* Move language switch left
- *(media-file)* Allow upload of media files
- *(media-file)* Dummy commit
- *(aineva)* Retrieve AINEVA bulletins
- *(external-server)* Incomplete commit
- *(external-server)* Show bulletins from other server instances
- *(region-mgmt)* Add region shapes
- Update eaws-regions
- *(eaws-regions)* Update regions
- *(neighbor)* Load polygons for AINEVA
- *(external-bulletins)* Show external bulletins in map
- *(external-regions)* Show external regions in list (toggle)
- *(external-regions)* Improve visualization
- *(map)* Speed up
- *(region-mgmt)* Select regions only within euregio
- *(region-mgmt)* Show afternoon map only if daytime dependency within euregio
- *(map)* Increase map height to 500px
- *(config)* Add structure to edit server and region configs
- *(region-mgmt)* Allow configuration of regions and server instances
- *(sass)* Slash as division
- *(region-mgmt)* Load region configuration during login
- *(media-file)* Load from config
- *(region)* Add map center lat and lng to region configuration
- *(neighbor-region)* Load in region config
- *(region)* Load status of neighbor regions
- *(region)* Structure config parmaters for regions
- Update yarn.lock
- Update yarn.lock
- *(media-file)* Send media file to additional addresses
- *(matrix)* Show new matrix fields
- *(danger-rating)* Change level 5 color to black
- *(eaws-matrix)* Use new matrix to define the severity of an avalanche problem
- *(matrix)* Hide frequency none and stability good
- *(matrix)* Remove matrix information from bulletin (only for avalanche problem)
- *(matrix)* Optional visualization of matrix
- *(wind_slab)* Rename avalanche problem
- *(matrix)* Allow to override danger rating manually
- *(avalanche-problems)* Add cornices and no distinct problem
- *(danger-rating-modificator)* Allow sub levels of danger rating
- *(yarn)* Add ngx-slider
- *(matrix)* Add values for snowpack stability, frequency and avalanche size
- *(matrix)* Shorten slider for snowpack stability and frequency, change color, add icon
- *(i18n)* Update translations
- *(matrix)* Improve slider style!
- *(regions)* Use region names from eaws repo, closes #222
- *(style)* Improve slider, add headlines
- *(avalanche-problem)* Delete obsolete parts
- *(i18n)* Update translations
- *(matrix)* Update style
- Refactor
- *(i18n)* Update translations

## [4.1.5] - 2022-03-16

### ⚙️ Miscellaneous Tasks

- *(i18n)* Update translations

## [4.1.4] - 2022-03-16

### 🚀 Features

- *(observations)* Export as GeoJSON
- *(observations)* MarkerColor
- *(observation-table)* Show type icons
- *(lawis)* Image count for incidents

### 🐛 Bug Fixes

- *(i18n)* Missing observation types
- Leaflet.canvas-markers
- Ngx-leaflet
- *(observations-map)* No canvas layer for now
- *(observation-map)* Canvas markers
- *(observations-map)* SVG fallback for Firefox
- *(observations-map)* SVG on canvas for Firefox
- *(observations)* IconSize
- *(observations-map)* ObservationSourceLayers

### 🚜 Refactor

- Connect to chat in full-layout
- *(chat.service)* Typings
- Use eaws-regions as node module
- Vendor ngx-leaflet-sidebar
- Vendor leaflet.canvas-markers
- *(lawis)* Extract functions
- *(wikisnow)* Extract functions
- *(observations)* Get shownObservations
- *(observations)* Currentcolor
- *(observations)* ObservationTypeIcons
- *(observations.service)* LoadAll()
- GeocodingService
- *(observation-map)* Typings
- *(observation-table)* ShownObservations
- *(observations)* InitMaps/initLayer
- *(observations)* ToGeoJSON
- *(observations-map)* MapInit()
- *(leaflet.canvas-markers)* Modernize
- *(GenericObservation)* Stability

### ⚙️ Miscellaneous Tasks

- Update to @auth0/angular-jwt 5.0
- Remove observation checkboxes
- *(observation-table)* Hide ObservationSource.AvalancheWarningService
- *(observations-map)* ZoomAnimation=false
- *(lwdkip)* Error reporting
- *(GenericObservation)* AvalancheSituation, dangerPattern

## [4.1.3] - 2022-02-09

### 🚀 Features

- *(observation)* External URL for lawis incident
- *(observation-editor)* Parse Leitstelle Tirol

### 🐛 Bug Fixes

- *(observations)* Lawis aspect is undefined
- *(observations)* Lola position is undefined
- *(observations)* Public lawis API

### 🚜 Refactor

- Feat(observation-editor): localdate-time

### ⚙️ Miscellaneous Tasks

- *(create-bulletin)* Allow copy of region if bulletin is not editable
- *(education)* Add educational content (closes #214)
- *(education)* Add translation strings
- *(education)* Change icon
- *(language)* Move language switch to own menu
- *(menu)* Move language, add education to personal menu
- *(i18n)* Update translations
- *(complexity)* Remove complexity button

## [4.1.2] - 2022-01-16

### ⚙️ Miscellaneous Tasks

- *(i18n)* Update translations
- *(blog)* Add methods to publish latest blog posts manually
- *(blog)* Add method to send latest blog to email, telegram and push
- *(blog)* Show alerts
- *(publication-status)* Add alerts
- *(i18n)* Update translations
- *(i18n)* Update translations

## [4.1.1] - 2022-01-13

### 🐛 Bug Fixes

- *(observations)* WikisnowECT

### ⚙️ Miscellaneous Tasks

- *(lint)* Migrate to @angular-eslint
- *(publication-status)* Allow manual publication in specific language
- *(test)* Add test methods for telegram and push

## [4.1.0] - 2022-01-05

### 🚀 Features

- *(observations)* Filter by source
- Replace avaobs.info with lola-kronos.info
- *(lola-safety)* DetailedPdf
- *(lola-kronos)* Show image count
- *(observations)* Lwdkip sperren

### 🐛 Bug Fixes

- *(observations)* Snow profile PDFs in Chrome
- *(i18n)* Add missing space

### ⚙️ Miscellaneous Tasks

- *(aran)* Update textcatUrl
- *(bulletins)* Info button also for admin
- *(i18n)* Update translations
- *(i18n)* Update translations
- Allow selection/deselection of groups of micro-regions (incomplete)
- *(multiple-regions)* Allow selection of multiple regions with CTRL or ALT key
- *(lola-kronos)* Table rows for evaluation
- *(observations)* Reorder filter
- *(lola-kronos)* $externalURL
- *(observations)* Exclusive iframe via $externalURL
- *(observation)* Maximizable dialog
- Maximize observation dialog
- *(push)* Allow triggering of push notifications
- Update to ngx-bootstrap 8

## [4.0.4] - 2021-12-01

### 🐛 Bug Fixes

- *(caaml)* Retrieve caaml bulletin
- *(json)* Show json output of bulletins

### ⚙️ Miscellaneous Tasks

- *(email)* Method to send test emails for admin

## [4.0.3] - 2021-11-30

### ⚙️ Miscellaneous Tasks

- *(i18n)* Update translations
- *(observations)* Fetch cached lawis details

## [4.0.2] - 2021-11-25

### 🚀 Features

- Val d'Aran

### 🐛 Bug Fixes

- *(observations)* "Lawinenabgänge " layer
- *(observation-editor)* P-fluid

### 🚜 Refactor

- *(build)* Migrate to yarn
- Remove unused e2e
- Update .gitignore

### ⚙️ Miscellaneous Tasks

- Update to angular 10.2
- Update to primeng 10
- Update to angular 11.2
- Update to primeng 11
- Update to angular 12.2
- Update to primeng 12
- Update to primeicons 4
- *(map-service)* Use new TMS
- *(json-bulletin)* Allow download and upload of JSON files
- Update to angular 13.0
- Update to primeng 13
- Ignore lint errors in GitLab CI
- *(observations)* Lwdkip error reporting
- *(Sentry)* Use @sentry/angular
- Update to ngx-translate 14
- *(Sentry)* Use GitLab
- Update README

## [4.0.1] - 2021-10-27

### 🐛 Bug Fixes

- *(ci)* Allow dev and prod build

## [4.0.0] - 2021-10-27

### 🚀 Features

- *(observations)* Include WikisnowECT
- *(observation)* Add AWS observers

### 🐛 Bug Fixes

- *(observations)* Lint
- *(settings)* Add missing import
- *(user)* Lint
- *(create-user)* Allow scrolling
- *(user)* Lint
- *(create-user)* Lint
- *(bulletins)* Show buttons only if user has specific roles
- *(users)* Allow multiple roles
- *(authentication)* Check for null
- *(create-bulletins)* Show foreign bulletins if daytime dependecy changes
- *(lint)* Fix
- Lint
- *(create-bulletin)* Make copy service public
- *(user)* Cancel button
- *(observations)* EventTypes i18n
- *(create-bulletin)* Set owner region and author while creating a bulletin

### 🚜 Refactor

- *(i18n)* Clean up translations
- *(regions.service)* Use Euregio eaws-regions
- *(regions.service)* Use Aran eaws-regions
- *(regions.service)* Update eaws-regionso
- *(map.service)* Typings
- Add form, add autocomplete
- *(map-service)* Detete obsolete TODOs
- *(observations-map-service)* Lint
- *(configuration)* Delete obsolete parameters (localFontsPath, localImagesPath, serverImagesUrlLocal)
- *(observations)* Use public lawis API

### ⚙️ Miscellaneous Tasks

- *(observations)* Where-clause for lwdkip
- *(README)* Document git submodule
- *(admin)* Delete social media config
- *(social-media-service)* Delete obsolete methods
- *(user)* Allow user creation
- *(user)* Update, create user
- *(user)* Add alert messages
- *(create-user)* Add validation
- *(create-user)* Extend validation
- *(package)* Bcryptjs
- *(settings)* Validate inputs
- *(package)* Update papaparse
- *(login)* Expand login field
- *(map-service)* Split map services for bulletins, observations and zamg
- *(constant-service)* Add brand color
- *(map-service)* Delete obsolete methods, use prod TMS
- *(zamg-models-map-service)* Use brand color from constant service, use prod TMS
- *(observations)* Use custom markers
- *(observations-map)* Add sidebar, move filter and layers into sidebar
- *(observation-markers)* Add possibility for custom svg markers
- *(observation-icons)* Use custom icons
- *(icons)* Use different icons, customize color
- *(observation-map-service)* Add ts-ignore
- *(observations)* Show table above map, style map elements
- *(observation-types)* Add types to distinguish between icons
- *(views)* Add views
- *(preview)* Allow PDF preview for bulletins
- *(i18n)* Update translations
- *(statistics)* Download statistics in admin area
- *(i18n)* Update translations
- *(observations)* Do not fetch lawis details
- *(observations)* Add csv export
- *(copy)* Copy bulletins from one day to another (close #194), copy textcat from one day to another
- *(natlefs)* Remove natlefs

## [3.0.5] - 2021-03-09

### 🚀 Features

- *(authentication.service)* Stay logged in
- *(observation)* Display avaobs.info on map
- *(observations)* Display lawis.at profiles
- *(observations)* Input for start/end date
- *(observations)* Input for date range
- *(observations)* Elevation filter
- *(observations)* Aspect filter
- *(observations)* Integrate LWD.NET observations
- *(observations)* Editor
- *(observations)* POST, PUT, DELETE
- *(observations)* Loading spinner, error message
- *(observations)* Loading spinner
- *(observations)* Display lawis.at incidents
- *(observations)* Display lola-safety.info
- *(observations)* Display lola-safety table
- *(observations)* Lawis incident as table dialog
- *(observations)* Date range buttons 1d/2d/3d/7d
- *(observations)* Table of all observations
- *(observations)* Show $externalURL in <iframe>
- *(observation-editor)* Add latitude/longitude/elevation
- *(observation-editor)* Geocode location
- *(observation-table)* Background color depending on eventType
- *(observations)* Fetch and cache lawis details
- *(observations)* Boundary filter for lawis
- *(observations)* Display LwdKip Sprengerfolge
- *(observations)* Display LwdKip Lawinenabgänge
- *(observations)* Add map legend for sources
- *(observation)* Marker color in dialog title
- *(observation)* Show OpenTopoMap on high zoom
- *(observations)* Display LwdKip Beobachtungen
- *(observations)* Display LwdKip BESCHREIBUNG
- *(observations)* Region filter

### 🐛 Bug Fixes

- *(create-bulletins)* Load foreign regions if bulletins were copied from another date
- *(natlefs)* Persistent weak layer
- *(avaObsApi)* From admin.avalanche.report (CORS)
- *(full-layout)* Close sidebar after click on menu entry
- *(observations)* Show natlefs on top of map
- *(observations)* Lint
- *(observations)* Natlefs is undefined
- *(observartion-table)* NgZone.run on table click
- *(observartion-table)* Dialog does not open
- *(lola-safety)* I18n keys
- Destroy maps via ngOnDestroy
- *(observations)* Lawis profiles as PDF in iframe
- *(observations)* AvaObs external URL for iframe
- *(observations)* Date filter for natlefs
- *(observation-editor)* Updating locationName for p-autoComplete
- *(observations)* Lwdkip timezone

### 🚜 Refactor

- *(authentication.service)* Object short notation
- *(natlefs)* Interface Natlefs replaces NatlefsModel
- *(natlefs.component)* Use ngFor
- *(natlefs.model)* Enums
- *(observations.service)* Typings
- *(observations)* Authenticate just before loading reports
- *(map.service)* Tyings
- *(app)* Remove unused leaflet-markercluster
- *(observations)* Import leaflet
- *(aspects)* Two-way data binding
- Code style
- *(observation)* Fix serialization of dates
- Code style
- *(observation)* Interface ObservationTableRow
- Move observations.service
- *(observations)* Obsolete var activeNatlefs
- *(regions.service)* Typings
- *(observation)* Function isAlbinaObservation
- *(observations)* Use ObservationSource
- *(observations)* Filtering
- *(observations)* ObservationLayers clearLayer
- *(observations)* From Promise to Observable
- *(observations)* Lawis detail fetching
- *(observations)* Const ObservationSourceColors
- *(map.service)* Record<string, L.TileLayer>
- App/observations/models
- *(regions.service)* GetRegionForId
- *(zamg-models)* Translated region name
- *(regions.service)* TranslateAllNames
- *(observations)* Remove obsolete async/await
- *(constants.service)* GetLat/getLng
- *(authentication.service)* Simplify isEuregio
- *(authentication.service)* Simplify isCurrentUserInRole
- *(authentication.service)* Use ?.
- *(constants.service)* Typings

### ⚙️ Miscellaneous Tasks

- *(map-colors)* Adopt map coloring
- *(natlefs)* Add natlefs translations in en, remove obsolete code
- *(natlefs)* Update natlefs view
- *(i18n)* Update translations
- *(observations)* Invalidate map size
- *(observations)* Close active natlefs
- *(observations)* Full screen map, style filter bar
- *(observations)* Allow the user to select layers
- *(observations)* Move layer control to bottom right corner
- *(observations)* Btn-success
- *(observations.service)* Keep natlefsToken
- *(observation-editor)* Icons
- *(observations)* Observation-table in card
- *(observations)* <p-calendar>
- *(observation)* Fetch observation before edit
- *(observation-table)* Date format
- *(observation-editor)* Required fields
- Use PrimeNG dialog for NATLEFS
- *(observations)* Number/date for dialog row
- *(lola-safety)* Enable i18n
- *(lola-safety)* Add headline strings
- *(lola-safety)* Improve i18n strings
- Configure i18n-ally for VS Code
- Update to angular 9.1.3
- *(observation-table)* Disable delete button for new observation
- *(observations)* Create layer group for each observations type
- Configure i18n-ally for VS Code
- *(observation-table)* Show map-marker icon when observation has coordinates
- *(app)* +npm run start-dev
- *(observations)* Get lwdkip layer ID via API
- *(observations)* Fix scrollbars on map
- *(snowpack)* New URL avalanche.report/alpsolut

## [3.0.4] - 2020-12-23

### 🚀 Features

- *(zamg-models)* +ECMWF

### 🐛 Bug Fixes

- *(zamg-models)* Leaflet usage

### 🚜 Refactor

- *(modelling.service)* Use ?.

### ⚙️ Miscellaneous Tasks

- *(zamg-models)* Typings
- *(zamg-models)* Switch ECMWF types with ←/→
- *(eps)* Add to side menu

## [3.0.3] - 2020-12-15

### 🐛 Bug Fixes

- *(create-bulletin)* Copy/paste of textcat
- *(matrix)* Update danger rating by click on number
- *(matrix)* Delete debugger statement
- *(lint)* Traling whitespaces

### 🚜 Refactor

- Fix typo in method name
- Fix typo in method name
- *(matrix)* Remove unused component

### ⚙️ Miscellaneous Tasks

- *(matrix)* Allow only natural or artificial cell selection
- *(notes)* Make notes persistent!
- *(bulletin-daytime-description)* Do not set matrix information above
- *(univie)* Remove univie setting
- *(i18n)* Update translations

## [3.0.2] - 2020-12-02

### 🚜 Refactor

- *(create-bulletin)* Delete obsolete field in pm data object

### ⚙️ Miscellaneous Tasks

- *(example-texts)* Add texts for snowpack structure comment

## [3.0.1] - 2020-12-02

### 🐛 Bug Fixes

- Delete wrong semi colon
- *(cop)* Use correct lang abbrevation for oc
- *(matrix)* Show EN texts in matrix for ES, CA and OC
- *(lang-oc)* Language code OC
- *(example-texts)* Update example texts for avActivityComment
- *(create-bulletin)* Set loading to false

### ⚙️ Miscellaneous Tasks

- Add region to pmdata object (for textcat)
- Add deprecation note to srcLang (textcat)
- *(cop)* Switch to textcat-ng for environments local and dev
- *(example-texts)* Prepare system to add example texts for snowpack
- *(example-texts)* Rename variables
- *(create-bulletin)* Do not check for incomplete translations (obsolete due to textcat-ng)
- *(textcat)* Change textcat url to textcat-ng

## [3.0.0] - 2020-11-12

### 🚀 Features

- Update angular-cli to 9.0.6
- Update resources to cli 9.0.6
- Update angular to v9.0.6 (WIP)
- *(modelling)* Add SNPOWPACK model
- *(modelling)* Add snowpack modelled meteo
- *(modelling)* Button to toggle fullscreen
- *(modelling)* Show table of ZAMG model results
- *(TelegramChannel)* Add configuration parameter for publication via telegram channels
- *(Layout)* Move admin page from main menu to drobdown menu
- Add complexity
- Allow manual selection of danger rating
- Use avalanche report TMS
- Initialize bulletin with danger rating 1
- Use danger rating and matrix information from first avalanche situation for manual danger rating
- Automatically detect danger ratings from avalanche problems (including elevation boundary)
- Allow warner to select complex situations only

### 🐛 Bug Fixes

- Lint some errors
- *(create-bulletin-component)* OpenTextcat
- Lint errors
- *(create-bulletin-component)* OpenTextcat
- Typo
- *(ModellingService)* Define responseType of HTTP get
- *(AppModule)* Remove entryComponents
- *(ModellingService)* Refactor
- *(angular-cli.json)* Load primeng css
- *(angular-cli.json)* Add nova-light theme css for primeng
- *(angular.json)* Add primeng css
- *(angular.json)* Add primeng css
- *(angular.json)* Add primeicons css
- *(createBulletinComponent)* P-dialog appendTo('body')
- *(dialog)* Fix lint errors
- *(_custom.scss)* Delete obsolete style for pm dialog
- *(Icons)* Update font-awesome to v4.7.0
- *(FullLayout)* Add snowpack menu entries to sidebar
- Remove duplicate ids of html elements
- *(BulletinModel)* Remove duplicate initialization of variables
- *(BulletinDaytimeDescription)* Typo
- *(AspectsComponent)* To not reset aspects onChange
- Change colors of complexity
- Lint
- Typos
- Delete avalanche situation
- Do not update danger rating if manual selection was choosen
- Lint
- Reset elevation for bulletin
- Update danger rating when daytime dependency changed
- Update danger rating if elevation low or high is selected
- Automatic danger assessment
- Delete debugger statement
- Persistent weak layers
- Persistent weak layers
- Registration of locales
- Reinitialize maps after login, load locked days only for own region
- Lint
- Typo in Aran region file
- Add padding to full layout
- Reduce file size of regions for Aran
- Retrieve correct language strings from textcat
- Lint
- Avoid avalanche situation
- Show elevation for regions, update elevation for bands
- Change of avalanche problem does not reset aspects
- Lint
- *(i18n)* Translations for danger patterns

### 🚜 Refactor

- *(angular)* Rename to albina-admin-gui
- *(modelling)* ConstantsService
- Remove obsolete npm packages
- Update polyfills, remove core-js
- *(app)* DirectTranslateLoader for i18n
- Use region codes, add lang and region comments
- Move functions to avalanche situation model

### ⚙️ Miscellaneous Tasks

- Update to angular 9.1
- Remove config parameter createCaaml
- I18n update
- *(Dialog)* Switch from p-dialog to material dialog for catalog of phrases
- *(map)* Use css blending mode multiply
- *(BulletinDaytimeDescription)* Add terrainFeature
- *(BulletinDaytimeDescription)* Add avalanche situation 3 - 5
- *(AvalancheSituation)* Add terrain feature and matrix information
- *(AvalancheSituation)* Allow 5 avalanche situations in bulletin
- *(AvalancheSituation)* Remove favourable situation
- *(Highlights)* Add highlights to bulletin
- Set danger rating from avalanche situation
- Improve ui for avalanche problems
- Add languages ES and CA
- Add translations
- Update translations, add region names to translation files
- Add region definitions for Aran
- Add Aran as a member of albina
- Move new problem buttons to the left (daytime dependency)
- Simplify polygons for Aran
- Add config parameter to publish bulletins for Aran
- Update CA translations
- Add translations in DE, FR, IT for region names
- Add language OC (locales missing in angular, using EN instead)
- Update translations
- Add language oc
- Load only own bulletins except within euregio
- Update translations
- Check avalanche problems prior to saving
- Add translations
- Move elevation dependency to daytime description
- Add map for zamg multi model points
- Add translations
- Do not use marker cluster for zamg model points
- Use circles for zamg model points in map
- Update translations
- *(i18n)* Update translations

## [2.1.4] - 2020-03-16

### 🐛 Bug Fixes

- *(AppModule)* Do not show report dialog (sentry)
- *(AppModule)* Do not show report dialog (sentry)

## [2.1.3] - 2020-02-24

### 🐛 Bug Fixes

- *(zamg-models)* Autofocus on select field
- *(zamg-models)* Delete unused import
- *(zamg-models)* Fix autofocus

## [2.1.2] - 2020-02-18

### 🐛 Bug Fixes

- De-at substitution fix

## [2.1.1] - 2020-02-14

### 🚀 Features

- Select zamg models with arrow keys!

### 🐛 Bug Fixes

- Add placeholder for login in different languages
- Use correct date when copy from yesterday
- Fix lint errors

## [2.1.0] - 2020-02-12

### 🚀 Features

- Add Sentry for error tracking
- *(login)* Display albina-admin-gui version
- Add French locale
- Add English locale
- *(createBulletins)* Add textarea for notes
- Add matrix in FR and EN
- Use ß in German
- Use ß in German (for groß)

### 🐛 Bug Fixes

- Ng lint
- URL is encoded twice
- *(login.component)* ConstantsService is private
- Use correct date
- Define background color and textcolor of disabled textareas for better readability
- ExpressionChangedAfterItHasBeenCheckedError fix with timeout
- Add white spaces, use const (lint errors)
- Lint error
- Allow regions to change owner (if no microregion of original owner is present anymore)

### 🚜 Refactor

- *(authentication-service)* NewAuthHeader
- *(settings)* Simplify setLang

### ⚙️ Miscellaneous Tasks

- *(Sentry)* Specify release
- *(Sentry)* Also log to console
- *(package.json)* Reset version to 0.0.0
- *(i18n)* Remove unused strings
- *(create-bulletin)* Use de/it for textcat
- *(matrix.component)* Use de/it

## [2.0.4] - 2019-12-05

### 🚀 Features

- Add sentry
- Add Transifex configuration

### 🐛 Bug Fixes

- Delete unused translations in de
- Copy texts from foreign regions
- Add hack for sentry
- Delete sentry

### ⚙️ Miscellaneous Tasks

- I18n update

## [2.0.3] - 2019-11-15

### 🐛 Bug Fixes

- Check elevation dialog on delete

## [2.0.2] - 2019-11-15

### 🐛 Bug Fixes

- Copy textcat

## [2.0.1] - 2019-11-15

### 🐛 Bug Fixes

- Save of natural avalanche release probability

## [2.0.0] - 2019-11-14

### 🐛 Bug Fixes

- Add config parameter for univie maps directory
- Add translation for observations
- Show chat
- Show chat icon
- Load active users in chat
- Code style
- Save natural avalanche danger rating

### 🚜 Refactor

- Rename map production url configuration parameter

### Create-bulletin

- Drop unused addThumbnailMap, d3

### Login.component

- Specify name for form fields

### Map

- GeoJSON and leaflet types
- Drop unsupported TileLayer options
- Fix MarkerClusterGroup usage

### Package.json

- Reflect license from LICENSE
- Update name, version, url

### Tslint

- Check and fix no-unused-variable

## [1.0.0] - 2018-11-30

### ⚙️ Miscellaneous Tasks

- Initial commit from @angular/cli

<!-- generated by git-cliff -->
