import { RegionConfiguration } from "./region-configuration.model";

export interface AuthorModel {
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  phone?: string;
  organization: string;
  roles: string[];
  image?: string;
  regions: RegionConfiguration[];
  apiUrl: string;
  languageCode?: string;
}
