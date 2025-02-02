import { Module } from "@medusajs/framework/utils";
import FacebookAdsModuleService from "./service";

export const FACEBOOK_ADS_MODULE = "facebook-ads";

export default Module(FACEBOOK_ADS_MODULE, {
  service: FacebookAdsModuleService,
});
