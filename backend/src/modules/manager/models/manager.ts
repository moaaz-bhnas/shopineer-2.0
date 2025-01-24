import { model } from "@medusajs/framework/utils";

export const Manager = model.define("manager", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
});
