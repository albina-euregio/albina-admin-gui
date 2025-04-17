export interface ServerModel {
  accessToken: string;
  refreshToken: string;
  name: string;
  email?: string;
  roles?: string[];
  regions?: string[];
  apiUrl: string;
}
