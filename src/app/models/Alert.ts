export interface Alert {
  type: "success" | "danger";
  msg: string;
  timeout: number;
}
