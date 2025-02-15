import { createProductsWorkflow } from "@medusajs/core-flows";
import { Link } from "@medusajs/framework/modules-sdk";
import { LinkDefinition, Logger, ProductDTO } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { StepResponse, WorkflowData } from "@medusajs/framework/workflows-sdk";
import { eq, map } from "lodash";
import { BRAND_MODULE } from "../../modules/brand";
import { SUPPLIER_MODULE } from "../../modules/supplier";

async function handleEntityLinkCreation({
  logger,
  products,
  additional_data,
  link,
  entityKey,
  module,
}: {
  logger: Logger;
  products: WorkflowData<ProductDTO[]>;
  additional_data: Record<string, any>;
  link: Link;
  entityKey: string; // e.g., 'supplier' or 'brand'
  module: string; // e.g., SUPPLIER_MODULE or BRAND_MODULE
}) {
  const entityIdKey = `${entityKey}_id`;
  if (!additional_data?.[entityIdKey]) return [];

  const activityId = logger.activity(
    `🔵 productsCreated hook: Creating links for products: ${products.map((p) => p.id)} with ${entityKey}: ${
      additional_data[entityIdKey]
    }`
  );

  const links: LinkDefinition[] = map(products, (product) => ({
    [Modules.PRODUCT]: {
      product_id: product.id,
    },
    [module]: {
      [entityIdKey]: additional_data[entityIdKey],
    },
  }));

  await link.create(links);

  logger.success(
    activityId,
    `🟢 productsCreated hook: Successfully created links for products: ${products.map(
      (p) => p.id
    )} with ${entityKey}: ${additional_data[entityIdKey]}`
  );

  return links;
}

createProductsWorkflow.hooks.productsCreated(
  async function ({ products, additional_data }, { container }) {
    const logger = container.resolve("logger");
    const link = container.resolve("link");

    const supplierLinks = await handleEntityLinkCreation({
      logger,
      products,
      additional_data,
      link,
      entityKey: "supplier",
      module: SUPPLIER_MODULE,
    });

    const brandLinks = await handleEntityLinkCreation({
      logger,
      products,
      additional_data,
      link,
      entityKey: "brand",
      module: BRAND_MODULE,
    });

    return new StepResponse(true, [...supplierLinks, ...brandLinks]);
  },
  async function rollBack(links, { container }) {
    if (eq(links.length, 0)) return;

    const link = container.resolve("link");

    await link.dismiss(links);
  }
);
