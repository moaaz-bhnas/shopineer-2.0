import { getProductBySlug } from "@lib/data-tgn/products"
import ProductActions from "modules-tgn/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  handle,
}: {
  handle: string
}) {
  const product = await getProductBySlug(handle)

  if (!product) {
    return null
  }

  return <ProductActions product={product.product} />
}
