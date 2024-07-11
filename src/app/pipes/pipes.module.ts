import { NgModule, ModuleWithProviders } from "@angular/core";
import { HtmlPipe } from "./html.pipe";

@NgModule({
  imports: [],
  declarations: [HtmlPipe],
  exports: [HtmlPipe],
})
export class PipeModule {
  static forRoot(): ModuleWithProviders<PipeModule> {
    return {
      ngModule: PipeModule,
    };
  }
}
