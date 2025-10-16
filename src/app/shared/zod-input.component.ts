import { zodCssClass } from "./zod-css-class";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { z } from "zod/v4";

@Component({
  selector: "app-zod-input",
  templateUrl: "zod-input.component.html",
  standalone: true,
  imports: [FormsModule],
})
export class ZodInputComponent<T> {
  zodType = input<z.ZodType<T>>();
  lang = input<string>();
  csv = input<boolean>(false);
  value = input<T>();
  valueChange = output<T>();

  cssClasses() {
    return zodCssClass(this.zodType(), this.value());
  }

  prettyError(): string | undefined {
    const result = this.zodType().safeParse(this.value());
    return result.error ? z.prettifyError(result.error) : undefined;
  }
}
