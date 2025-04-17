export interface UserModel {
  name: string;
  email: string;
  organization: string;
  image: string;
  password?: string;
  roles: string[];
  regions: string[];
  languageCode?: string;
}
