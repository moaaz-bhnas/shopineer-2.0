import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import TogetherModule from "../modules/together";

export default defineLink(ProductModule.linkable.product, {
  linkable: TogetherModule.linkable.together,
  isList: true,
  deleteCascade: true,
});
