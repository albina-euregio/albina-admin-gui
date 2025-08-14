import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "html",
  pure: true,
  standalone: true,
})
export class HtmlPipe implements PipeTransform {
  transform(text: string): string {
    if (text) {
      return text.replace(/<br\/>/g, "\n");
    } else {
      return text;
    }
  }
}
