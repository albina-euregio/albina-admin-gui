import { RegionConfiguration } from "app/providers/configuration-service/configuration.service";

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
