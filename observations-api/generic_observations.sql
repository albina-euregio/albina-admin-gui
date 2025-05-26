CREATE TABLE `generic_observations` (
  `SOURCE` varchar(191) NOT NULL COMMENT 'Source of this observation',
  `ID` varchar(191) NOT NULL COMMENT 'External ID of this observation',
  `OBS_TYPE` enum('SimpleObservation','Evaluation','Avalanche','Blasting','Closure','Profile','TimeSeries','Webcam') NOT NULL COMMENT 'Type of this observation',
  `EXTERNAL_URL` longtext COMMENT 'External URL to display as iframe',
  `EXTERNAL_IMG` longtext COMMENT 'External image to display. Multiple images are persisted using line separator.',
  `STABILITY` enum('good','fair','poor','very_poor') DEFAULT NULL COMMENT 'Snowpack stability that can be inferred from this observation',
  `ASPECTS` set('N','NE','E','SE','S','SW','W','NW') DEFAULT NULL COMMENT 'Aspects corresponding with this observation',
  `AUTHOR_NAME` varchar(191) DEFAULT NULL COMMENT 'Name of the author',
  `OBS_CONTENT` longtext COMMENT 'Free-text content',
  `OBS_DATA` longtext COMMENT 'Additional data (e.g. original data stored when fetching from external API)' CHECK (json_valid(`OBS_DATA`)),
  `ELEVATION` double DEFAULT NULL COMMENT 'Elevation in meters',
  `ELEVATION_LOWER_BOUND` double DEFAULT NULL COMMENT 'Lower bound of elevation in meters',
  `ELEVATION_UPPER_BOUND` double DEFAULT NULL COMMENT 'Upper bound of elevation in meters',
  `EVENT_DATE` datetime DEFAULT NULL COMMENT 'Date when the event occurred',
  `LATITUDE` double DEFAULT NULL COMMENT 'Location latitude (WGS 84)',
  `LOCATION_NAME` varchar(191) DEFAULT NULL COMMENT 'Location name',
  `LONGITUDE` double DEFAULT NULL COMMENT 'Location longitude (WGS 84)',
  `REGION_ID` varchar(191) DEFAULT NULL COMMENT 'Micro-region code (possibly computed from latitude/longitude)',
  `REPORT_DATE` datetime DEFAULT NULL COMMENT 'Date when the observation has been reported',
  `AVALANCHE_PROBLEMS` set('new_snow','wind_slab','persistent_weak_layers','wet_snow','gliding_snow','favourable_situation','cornices','no_distinct_avalanche_problem') DEFAULT NULL COMMENT 'Avalanche problems corresponding with this observation',
  `DANGER_PATTERNS` set('dp1','dp2','dp3','dp4','dp5','dp6','dp7','dp8','dp9','dp10') DEFAULT NULL COMMENT 'Danger patterns corresponding with this observation',
  `DANGER_SOURCE` varchar(191) DEFAULT NULL COMMENT 'Danger source UUID',
  `IMPORTANT_OBSERVATION` set('SnowLine','SurfaceHoar','Graupel','StabilityTest','IceFormation','VeryLightNewSnow','ForBlog') DEFAULT NULL COMMENT 'Important observations',
  `EXTRA_DIALOG_ROWS` longtext COMMENT 'Additional information to display as table rows in the observation dialog' CHECK (json_valid(`EXTRA_DIALOG_ROWS`)),
  `PERSON_INVOLVEMENT` enum('Dead', 'Injured', 'Uninjured', 'No', 'Unknown') DEFAULT NULL COMMENT 'Person involvement',
  `DELETED` BOOL DEFAULT false NULL COMMENT 'Observations marked as deleted will no longer be returned in the list';
  `ALLOW_EDIT` BOOL DEFAULT false NULL COMMENT 'Allows modifying observations fetched from external sources';
  PRIMARY KEY (`SOURCE`,`ID`),
  KEY `generic_observations_EVENT_DATE_IDX` (`EVENT_DATE`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--ALTER TABLE generic_observations MODIFY COLUMN DELETED BOOL DEFAULT false NULL COMMENT 'Observations marked as deleted will no longer be returned in the list';
--ALTER TABLE generic_observations MODIFY COLUMN ALLOW_EDIT BOOL DEFAULT false NULL COMMENT 'Allows modifying observations fetched from external sources';
--ALTER TABLE generic_observations MODIFY COLUMN IMPORTANT_OBSERVATION set('SnowLine','SurfaceHoar','Graupel','StabilityTest','IceFormation','VeryLightNewSnow','ForBlog') DEFAULT NULL COMMENT 'Important observations';
--ALTER TABLE generic_observations MODIFY COLUMN OBS_TYPE enum('SimpleObservation', 'Evaluation', 'Avalanche', 'Blasting', 'Closure', 'Profile', 'TimeSeries', 'Webcam', 'DrySnowfallLevel') NOT NULL COMMENT 'Type of this observation';
--ALTER TABLE generic_observations ADD DANGER_SOURCE varchar(191) NULL COMMENT 'Danger source UUID';
--ALTER TABLE generic_observations ADD CONSTRAINT generic_observations_danger_sources_FK FOREIGN KEY (DANGER_SOURCE) REFERENCES danger_sources(ID) ON DELETE SET NULL;

-- CREATE USER 'observations-api'@'%' IDENTIFIED BY 'EopheekeiNg1hoomo';
-- GRANT alter ON albina_dev.generic_observations TO 'observations-api'@'%';
-- GRANT delete ON albina_dev.generic_observations TO 'observations-api'@'%';
-- GRANT insert ON albina_dev.generic_observations TO 'observations-api'@'%';
-- GRANT select ON albina_dev.generic_observations TO 'observations-api'@'%';
-- GRANT update ON albina_dev.generic_observations TO 'observations-api'@'%';
