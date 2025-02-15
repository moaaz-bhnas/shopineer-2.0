import { updateProductVariantsWorkflow } from "@medusajs/core-flows";
import { CalculatedPriceSet } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { StepResponse, transform } from "@medusajs/framework/workflows-sdk";
import { map } from "lodash";
import { PRICE_HISTORY_MODULE } from "../../modules/price-history";
import PriceHistoryModuleService from "../../modules/price-history/service";

updateProductVariantsWorkflow.hooks.productVariantsUpdated(async function addPriceUpdate(
  { product_variants },
  { container }
) {
  const logger = container.resolve("logger");
  const link = container.resolve("link");
  const regionModuleService = container.resolve(Modules.REGION);
  const priceHistoryModuleService: PriceHistoryModuleService = container.resolve(PRICE_HISTORY_MODULE);

  const activityId = logger.activity(
    `🔵 addPriceUpdate: Creating price history for variants: ${map(product_variants, "id")}`
  );

  const regions = await regionModuleService.listRegions();

  const variantPricesMap = await (async function mapPricesToVariant() {
    const map = new Map<string, CalculatedPriceSet[]>();
    const pricingModuleService = container.resolve(Modules.PRICING);

    for (const region of regions) {
      for (const variant of product_variants) {
        if (!variant.price_set) continue;

        const prices = await pricingModuleService.calculatePrices(
          {
            id: [variant.price_set.id],
          },
          {
            context: {
              currency_code: region.currency_code,
              region_id: region.id,
            },
          }
        );

        map.set(variant.id, prices);
      }
    }

    return map;
  })();

  logger.progress(
    activityId,
    `🔵 addPriceUpdate: Calculated prices for each region for each variant: ${JSON.stringify(variantPricesMap)}`
  );

  for (const [variantId, prices] of variantPricesMap) {
    const pricesHistories = await priceHistoryModuleService.createPriceHistories(
      prices.map((price) => {
        return {
          currency_code: price.currency_code,
          amount: Number(price.calculated_amount),
          raw_amount: price.raw_calculated_amount,
        };
      })
    );

    const linksToCreate = pricesHistories.map((item) => {
      return {
        [Modules.PRODUCT]: {
          product_variant_id: variantId,
        },
        [PRICE_HISTORY_MODULE]: {
          price_history_id: item.id,
        },
      };
    });

    await link.create(linksToCreate);
  }

  logger.success(
    activityId,
    `🟢 addPriceUpdate: Price history created for variants: ${map(product_variants, "id")} with links`
  );

  return new StepResponse([], []);
});
