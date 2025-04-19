import { Product } from "../data-tgn/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: Product[],
  sortBy: SortOptions
): Product[] {
  let sortedProducts = [...products]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Sort products based on the final_price
    sortedProducts.sort((a, b) => {
      const diff = a.final_price - b.final_price
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  console.log("🐦🐦", {
    sortedProducts: sortedProducts.map(({ id }) => id),
    sortBy,
  })

  return sortedProducts
}
