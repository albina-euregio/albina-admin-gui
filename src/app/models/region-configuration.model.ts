import { zRegion, zRegionLanguageConfiguration } from "app/providers/albina-api/zod.gen";
import { withShowIf, withValueI18n } from "app/shared/zod-util";
import { z } from "zod/v4";

export const LanguageConfigurationSchema = zRegionLanguageConfiguration.pick({
  lang: true,
  websiteName: true,
  warningServiceName: true,
  warningServiceEmail: true,
  url: true,
  urlWithDate: true,
});

export type LanguageConfiguration = z.infer<typeof LanguageConfigurationSchema>;

export const RegionConfigurationGeneralSchema = zRegion.pick({
  id: true,
  coatOfArms: true,
  staticUrl: true,
  serverImagesUrl: true,
  educationUrl: true,
  awsomeUrl: true,
  microRegions: true,
  subRegions: true,
  superRegions: true,
  neighborRegions: true,
});

export const RegionConfigurationPublicationSchema = zRegion.pick({
  publishBulletins: true,
  enabledLanguages: true,
  ttsLanguages: true,
  publishBlogs: true,
  createCaamlV6: true,
  createJson: true,
  //
  createMaps: true,
  geoDataDirectory: true,
  mapLogoPosition: true,
  //
  createPdf: true,
  pdfColor: true,
  pdfMapYAmPm: true,
  pdfMapYFd: true,
  pdfMapWidthAmPm: true,
  pdfMapWidthFd: true,
  pdfMapHeight: true,
  logoPath: true,
  logoBwPath: true,
  pdfFooterLogo: true,
  pdfFooterLogoColorPath: true,
  pdfFooterLogoBwPath: true,
  imageColorbarColorPath: true,
  imageColorbarBwPath: true,
  //
  createSimpleHtml: true,
  sendEmails: true,
  emailColor: true,
  sendTelegramMessages: true,
  sendWhatsAppMessages: true,
  sendPushNotifications: true,
});

export const RegionConfigurationComponentsSchema = zRegion.pick({
  enableDangerSources: true,
  enableObservations: true,
  enableIncidents: true,
  enableModelling: true,
  enableIcon: true,
  enableLineaExport: true,
});

export const RegionConfigurationConfigurationSchema = zRegion.pick({
  showMatrix: true,
  enableMediaFile: true,
  enableStrategicMindset: true,
  enableStressLevel: true,
  enableAvalancheProblemCornices: true,
  enableAvalancheProblemNoDistinctAvalancheProblem: true,
  enabledTextcatFields: true,
  enabledEditableFields: true,
});

// The generated schemas carry no widget metadata: label the enum options of the list fields with
// existing i18n keys instead of the raw `${field}.#` fallback (which has no translations).
withValueI18n(RegionConfigurationPublicationSchema.shape.enabledLanguages, "menu.#");
withValueI18n(RegionConfigurationPublicationSchema.shape.ttsLanguages, "menu.#");
withValueI18n(RegionConfigurationConfigurationSchema.shape.enabledTextcatFields, "bulletins.create.label.#");
withValueI18n(RegionConfigurationConfigurationSchema.shape.enabledEditableFields, "bulletins.create.label.#");

export const RegionConfigurationSchema = z.object({
  ...RegionConfigurationGeneralSchema.shape,
  ...RegionConfigurationPublicationSchema.shape,
  ...RegionConfigurationComponentsSchema.shape,
  ...RegionConfigurationConfigurationSchema.shape,
  languageConfigurations: LanguageConfigurationSchema.array().nullish().describe("Language configuration"),
  defaultLang: z.string().nullish().describe("Default language for language dependent configuration"),
});

withShowIf(RegionConfigurationSchema, {
  geoDataDirectory: (m) => m.createMaps,
  mapLogoPosition: (m) => m.createMaps,
  createPdf: (m) => m.createMaps,
  createSimpleHtml: (m) => m.createMaps,
  sendEmails: (m) => m.createMaps,
  sendTelegramMessages: (m) => m.createMaps,
  sendWhatsAppMessages: (m) => m.createMaps,
  sendPushNotifications: (m) => m.createMaps,

  pdfColor: (m) => m.createPdf,
  pdfMapYAmPm: (m) => m.createPdf,
  pdfMapYFd: (m) => m.createPdf,
  pdfMapWidthAmPm: (m) => m.createPdf,
  pdfMapWidthFd: (m) => m.createPdf,
  pdfMapHeight: (m) => m.createPdf,
  logoPath: (m) => m.createPdf,
  logoBwPath: (m) => m.createPdf,
  pdfFooterLogo: (m) => m.createPdf,
  pdfFooterLogoColorPath: (m) => m.pdfFooterLogo,
  pdfFooterLogoBwPath: (m) => m.pdfFooterLogo,
  imageColorbarColorPath: (m) => m.createPdf,
  imageColorbarBwPath: (m) => m.createPdf,

  emailColor: (m) => m.sendEmails,
});

export type RegionConfiguration = z.infer<typeof RegionConfigurationSchema>;
