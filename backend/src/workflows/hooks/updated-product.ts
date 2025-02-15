import { updateProductsWorkflow } from "@medusajs/core-flows";
import { Link } from "@medusajs/framework/modules-sdk";
import { LinkDefinition, Logger, ProductDTO, RemoteQueryFunction } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { StepResponse, WorkflowData } from "@medusajs/framework/workflows-sdk";
import { filter, map } from "lodash";
import { BRAND_MODULE } from "../../modules/brand";
import { SUPPLIER_MODULE } from "../../modules/supplier";

async function handleEntityLinking({
  logger,
  products,
  additional_data,
  link,
  query,
  entityKey,
  module,
}: {
  logger: Logger;
  products: WorkflowData<ProductDTO[]>;
  additional_data: Record<string, any>;
  link: Link;
  query: Omit<RemoteQueryFunction, symbol>;
  entityKey: string; // e.g., 'supplier' or 'brand'
  module: string; // e.g., SUPPLIER_MODULE or BRAND_MODULE
}) {
  const entityIdKey = `${entityKey}_id`;
  if (!additional_data?.[entityIdKey]) return [];

  const activityId = logger.activity(
    `🔵 productsUpdated hook: Creating links for products: ${products.map((p) => p.id)} with ${entityKey}: ${
      additional_data[entityIdKey]
    }`
  );

  // 1. Use query module to retrieve the products, each with its entity
  const { data } = await query.graph({
    entity: "product",
    fields: [`${entityKey}.*`],
    filters: { id: map(products, "id") },
  });
  const productsWithEntities = filter(data, `${entityKey}.id`);

  // 2. Dismiss existing links between each product and its entities
  await link.dismiss(
    map(productsWithEntities, (product: any) => ({
      [Modules.PRODUCT]: {
        product_id: product.id,
      },
      [module]: {
        [`${entityKey}_id`]: product[entityKey].id,
      },
    }))
  );

  logger.progress(
    activityId,
    `🔵 productsUpdated hook: Dismissed links for products: ${map(productsWithEntities, "id")} with ${entityKey}: ${map(
      productsWithEntities,
      `${entityKey}.id`
    )}`
  );

  // 3. Create new links between each product and the new entity
  const links = await link.create(
    map(products, (product) => ({
      [Modules.PRODUCT]: {
        product_id: product.id,
      },
      [module]: {
        [`${entityKey}_id`]: additional_data[entityIdKey],
      },
    }))
  );

  logger.success(
    activityId,
    `🟢 productsCreated hook: Successfully created links for products: ${products.map(
      (p) => p.id
    )} with ${entityKey}: ${additional_data[entityIdKey]}`
  );

  return links;
}

updateProductsWorkflow.hooks.productsUpdated(
  async function ({ products, additional_data }, { container }) {
    const logger = container.resolve("logger");
    const query = container.resolve("query");
    const link = container.resolve("link");

    const supplierLinks = await handleEntityLinking({
      logger,
      products,
      additional_data,
      link,
      query,
      entityKey: "supplier",
      module: SUPPLIER_MODULE,
    });
    const brandLinks = await handleEntityLinking({
      logger,
      products,
      additional_data,
      link,
      query,
      entityKey: "brand",
      module: BRAND_MODULE,
    });

    return new StepResponse(true, [...supplierLinks, ...brandLinks]);
  },
  async function rollBack(links, { container }) {
    // if (eq(links.length, 0)) return;
    // const link = container.resolve("link");
    // await link.dismiss(links);
  }
);
