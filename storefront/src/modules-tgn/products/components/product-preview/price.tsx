import { Text, clx } from "@medusajs/ui"

export default async function PreviewPrice({ price }: { price: number }) {
  if (!price) {
    return null
  }

  return (
    <>
      {/* {price.discount > 0 && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.price} EGP
        </Text>
      )} */}
      <Text
        className={clx("text-ui-fg-muted", {
          // "text-ui-fg-interactive": price.discount > 0,
        })}
        data-testid="price"
      >
        {price} EGP
      </Text>
    </>
  )
}
