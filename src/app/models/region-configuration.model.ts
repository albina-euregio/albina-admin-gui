import { TextcatTextfield } from "app/enums/enums";
import { widgetRegistry } from "app/shared/zod-schema-form.widget-registry";
import { withShowIf } from "app/shared/zod-util";
import { z } from "zod/v4";

export const LanguageConfigurationSchema = z.object({
  lang: z.string().nullish().describe("Language code"),
  websiteName: z.string().nullish().describe("Website name"),
  warningServiceName: z.string().nullish().describe("Warning service name"),
  warningServiceEmail: z.email().nullish().describe("Warning service email"),
  url: z.url().nullish().describe("Website URL"),
  urlWithDate: z.url().nullish().describe("Website URL for date given by %s"),
});

export type LanguageConfiguration = z.infer<typeof LanguageConfigurationSchema>;

export const RegionConfigurationGeneralSchema = z.object({
  id: z.string().nullish().describe("Region ID"),
  coatOfArms: z.url().nullish().describe("Image URL for coat of arms"),
  staticUrl: z.url().nullish().describe("URL to static avalanche files"),
  serverImagesUrl: z.url().nullish().describe("URL to server images"),
  educationUrl: z.url().nullish().describe("URL to education content"),
  awsomeUrl: z.url().nullish().describe("URL to AWSOME modelling configuration"),
  microRegions: z.coerce.number().nullish().describe("Number of micro regions"),
  subRegions: z.string().array().nullish().describe("ID of sub regions"),
  superRegions: z.string().array().nullish().describe("ID of super regions"),
  neighborRegions: z.string().array().nullish().describe("ID of neighbouring regions"),
});

export const RegionConfigurationPublicationSchema = z.object({
  publishBulletins: z.boolean().nullish().describe("Publish avalanche forecast"),
  enabledLanguages: z.string().array().nullish().describe("Enabled languages"),
  ttsLanguages: z.string().array().nullish().describe("Text-to-speech languages"),
  publishBlogs: z.boolean().nullish().describe("Publish blog posts"),
  createCaamlV5: z.boolean().nullish().describe("Create CAAML v5"),
  createCaamlV6: z.boolean().nullish().describe("Create CAAML v6"),
  createJson: z.boolean().nullish().describe("Create JSON"),
  //
  createMaps: z.boolean().nullish().describe("Create maps"),
  geoDataDirectory: z.string().nullish().describe("Geodata directory"),
  mapLogoPosition: z.string().nullish().describe("Logo position for map"),
  //
  createPdf: z.boolean().nullish().describe("Create PDF"),
  pdfColor: z.string().nullish().describe("PDF color"),
  pdfMapYAmPm: z.coerce.number().nullish().describe("Y for PDF map (am/pm)"),
  pdfMapYFd: z.coerce.number().nullish().describe("Y for PDF map (fd)"),
  pdfMapWidthAmPm: z.coerce.number().nullish().describe("Map width for PDF (am/pm)"),
  pdfMapWidthFd: z.coerce.number().nullish().describe("Map width for PDF (fd)"),
  pdfMapHeight: z.coerce.number().nullish().describe("Map height for PDF"),
  logoPath: z.string().nullish().describe("Logo for PDF (color)"),
  logoBwPath: z.string().nullish().describe("Logo for PDF (bw)"),
  pdfFooterLogo: z.boolean().nullish().describe("Logo for PDF footer"),
  pdfFooterLogoColorPath: z.string().nullish().describe("Logo for PDF footer (color)"),
  pdfFooterLogoBwPath: z.string().nullish().describe("Logo for PDF footer (bw)"),
  imageColorbarColorPath: z.string().nullish().describe("Colorbar (color)"),
  imageColorbarBwPath: z.string().nullish().describe("Colorbar (b/w)"),
  //
  createSimpleHtml: z.boolean().nullish().describe("Create simple HTML"),
  sendEmails: z.boolean().nullish().describe("Send emails"),
  emailColor: z.string().nullish().describe("Email color"),
  sendTelegramMessages: z.boolean().nullish().describe("Send telegram messages"),
  sendWhatsAppMessages: z.boolean().nullish().describe("Send WhatsApp messages"),
  sendPushNotifications: z.boolean().nullish().describe("Send push notifications"),
});

export const RegionConfigurationComponentsSchema = z.object({
  enableDangerSources: z.boolean().nullish().describe("Enable danger sources"),
  enableObservations: z.boolean().nullish().describe("Enable observations"),
  enableIncidents: z.boolean().nullish().describe("Enable incidents"),
  enableModelling: z.boolean().nullish().describe("Enable modelling"),
  enableIcon: z.boolean().nullish().describe("Enable weather"),
  enableLineaExport: z.boolean().nullish().describe("Enable LINEA export"),
});

export const RegionConfigurationConfigurationSchema = z.object({
  showMatrix: z.boolean().nullish().describe("Show matrix"),
  enableMediaFile: z.boolean().nullish().describe("Enable media file"),
  enableStrategicMindset: z.boolean().nullish().describe("Enable strategic mindset"),
  enableStressLevel: z.boolean().nullish().describe("Enable stress level"),
  enableAvalancheProblemCornices: z.boolean().nullish().describe("Enable avalanche problem CORNICES"),
  enableAvalancheProblemNoDistinctAvalancheProblem: z
    .boolean()
    .nullish()
    .describe("Enable avalanche problem NO DISTINCT AVALANCHE PROBLEM"),
  enabledTextcatFields: z
    .enum(TextcatTextfield)
    .array()
    .register(widgetRegistry, { valueI18n: "bulletins.create.label.#" })
    .default(() => [
      TextcatTextfield.highlights,
      TextcatTextfield.avActivityHighlights,
      TextcatTextfield.avActivityComment,
      TextcatTextfield.snowpackStructureHighlights,
      TextcatTextfield.snowpackStructureComment,
      TextcatTextfield.tendencyComment,
    ])
    .describe("Textfields for bulletins to be entered using textcat"),
  enabledEditableFields: z
    .enum(TextcatTextfield)
    .array()
    .register(widgetRegistry, { valueI18n: "bulletins.create.label.#" })
    .nullish()
    .describe("Editable textfields instead of textcat for bulletins"),
});

export const RegionConfigurationSchema = z.object({
  ...RegionConfigurationGeneralSchema.shape,
  ...RegionConfigurationPublicationSchema.shape,
  ...RegionConfigurationComponentsSchema.shape,
  ...RegionConfigurationConfigurationSchema.shape,
  languageConfigurations: LanguageConfigurationSchema.array().nullish().describe("Language configuration"),
  defaultLang: z.string().nullish().describe("Default language for language dependent configuration"),
});

withShowIf(RegionConfigurationSchema, {
  geoDataDirectory: ["createMaps", true],
  mapLogoPosition: ["createMaps", true],
  createPdf: ["createMaps", true],
  createSimpleHtml: ["createMaps", true],
  sendEmails: ["createMaps", true],
  sendTelegramMessages: ["createMaps", true],
  sendWhatsAppMessages: ["createMaps", true],
  sendPushNotifications: ["createMaps", true],

  pdfColor: ["createPdf", true],
  pdfMapYAmPm: ["createPdf", true],
  pdfMapYFd: ["createPdf", true],
  pdfMapWidthAmPm: ["createPdf", true],
  pdfMapWidthFd: ["createPdf", true],
  pdfMapHeight: ["createPdf", true],
  logoPath: ["createPdf", true],
  logoBwPath: ["createPdf", true],
  pdfFooterLogo: ["createPdf", true],
  pdfFooterLogoColorPath: ["pdfFooterLogo", true],
  pdfFooterLogoBwPath: ["pdfFooterLogo", true],
  imageColorbarColorPath: ["createPdf", true],
  imageColorbarBwPath: ["createPdf", true],

  emailColor: ["sendEmails", true],
});

export type RegionConfiguration = z.infer<typeof RegionConfigurationSchema>;
