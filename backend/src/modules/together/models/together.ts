import { model } from "@medusajs/framework/utils";

export const BoughtTogether = model.define("together", {
  id: model.id().primaryKey(),
  product_handle: model.text(),
  frequency: model.number(),
});
