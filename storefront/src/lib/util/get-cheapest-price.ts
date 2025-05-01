import { Product, ProductVariant } from "@lib/types"

interface CheapestVariantResult {
  variant: ProductVariant
  price: number
}

export function getCheapestVariant(
  product: Product
): CheapestVariantResult | null {
  if (!product.variants || product.variants.length === 0) {
    return null
  }

  const cheapestVariant = product.variants.reduce((cheapest, current) => {
    return current.price < cheapest.price ? current : cheapest
  }, product.variants[0])

  return {
    variant: cheapestVariant,
    price: cheapestVariant.price,
  }
}
