// https://lawis.at/lawis_api/normalizer/profile/
export interface Lawis extends Array<Profile> {}

export interface Profile {
  profil_id: number;
  datum: string;
  country_id: number;
  region_id: number;
  subregion_id: number;
  ort: string;
  seehoehe: number;
  latitude: number;
  longitude: number;
  hangneigung: number;
  exposition_id: number | null;
  loggedon: string;
  revision: number;
}

// https://lawis.at/lawis_api/normalizer/profile/13794?lang=de
export interface ProfileDetails {
  id: number;
  name: string;
  profildatum: string;
  loggedon: string;
  country_id: string;
  region_id: string;
  subregion_id: string;
  ort: string;
  seehoehe: number;
  latitude: number;
  longitude: number;
  hangneigung: number;
  exposition_id: string;
  windgeschwindigkeit_id: string;
  windrichtung_id: null;
  lufttemperatur: number;
  niederschlag_id: string;
  intensity_id: null;
  bewoelkung_id: string;
  bemerkungen: string;
  active: number;
  email: string;
  obfuscate_email: boolean;
  revision: number;
  files: Files;
}

export interface Files {
  pdf: string;
  png: string;
  thumbnail: string;
}

// https://www.lawis.at/lawis_api/normalizer/profile/13794/tests?lang=de
export interface ProfileTest {
  id: number;
  height: string;
  belastungsst: number;
  testprocedureend: string;
  test_id: string;
  profil_id: number;
}
