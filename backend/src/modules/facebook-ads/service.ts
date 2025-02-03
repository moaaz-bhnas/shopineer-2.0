import { MedusaError } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa/types";
import * as adsSdk from "facebook-nodejs-ads-sdk";

type Options = {
  accessToken: string;
};

type InjectedDependencies = {
  logger: Logger;
};

export default class FacebookAdsModuleService {
  static identifier = "facebook-ads";
  protected logger_: Logger;
  protected options_: Options;
  protected client;

  constructor({ logger }: InjectedDependencies, options: Options) {
    this.logger_ = logger;
    this.options_ = options;

    this.client = adsSdk.FacebookAdsApi.init(options.accessToken);
  }

  static validateOptions(options: Record<any, any>) {
    const requiredFields = ["accessToken"];

    for (const field of requiredFields) {
      if (!options[field]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} is required in the provider's options`);
      }
    }
  }

  test() {}
}
