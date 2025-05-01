import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { IMAGE_BASE_URL } from "@lib/constants"
import { Product } from "@lib/types"
import { getCheapestVariant } from "@lib/util/get-cheapest-price"

export default async function ProductPreview({
  product,
  isFeatured,
}: {
  product: Product
  isFeatured?: boolean
}) {
  // const [pricedProduct] = await getProductsById({
  //   ids: [product.id!],
  //   regionId: region.id,
  // })

  // if (!pricedProduct) {
  //   return null
  // }

  // const { cheapestPrice } = getProductPrice({
  //   product: pricedProduct,
  // })

  const cheapestPrice = getCheapestVariant(product)

  // Always null as product is fetched without variants

  console.log("🫣", cheapestPrice)

  return (
    <LocalizedClientLink
      href={`/products-tgn/${product.slug}`}
      className="group"
    >
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={`${IMAGE_BASE_URL}/${product.thumbnail?.path}`}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="flex txt-compact-medium mt-4 justify-between">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice.price} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
