import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "html",
  pure: true,
  standalone: true,
})
export class HtmlPipe implements PipeTransform {
  transform(text: any): any {
    if (text) {
      return text.replace(/<br\/>/g, "\n");
    } else {
      return text;
    }
  }
}
