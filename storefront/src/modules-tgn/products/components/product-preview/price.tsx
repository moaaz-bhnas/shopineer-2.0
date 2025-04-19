import { Text, clx } from "@medusajs/ui"
import { Product } from "@lib/data-tgn/products"

export default async function PreviewPrice({ product }: { product: Product }) {
  if (!product) {
    return null
  }

  return (
    <>
      {product.discount > 0 && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {product.price} EGP
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": product.discount > 0,
        })}
        data-testid="price"
      >
        {product.final_price} EGP
      </Text>
    </>
  )
}
