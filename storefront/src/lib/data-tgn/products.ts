// Base URL for the Marie M Hijab API
import { API_BASE_URL } from "../constants"
import { sortProducts } from "../util-tgn/sort-products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Product, ProductsResponse, ProductResponse } from "../types"

export async function getProductBySlug(
  slug: string
): Promise<ProductResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/products/${slug}`)
  const data: ProductResponse = await response.json()
  return data.data
}

export async function getProductsList(queryParams?: {
  category_id?: string
  search?: string
  select?: string
  recommended?: boolean
  locale?: string
  limit?: number
  page?: number
  sortBy?: string
}): Promise<{
  response: { products: Product[]; count: number }
  nextPage: number | null
  queryParams?: any
}> {
  const validPageParam = Math.max(queryParams?.page || 1, 1)

  const queryString = new URLSearchParams({
    page: validPageParam.toString(),
    ...(queryParams?.category_id && { category_id: queryParams.category_id }),
    ...(queryParams?.search && { search: queryParams.search }),
    ...(queryParams?.select && { select: queryParams.select }),
    ...(queryParams?.recommended && { recommended: "1" }),
    ...(queryParams?.locale && { lang: queryParams.locale }),
    ...(queryParams?.limit && { per_page: String(queryParams.limit) }),
    ...(queryParams?.page && { page: String(queryParams.page) }),
    ...(queryParams?.sortBy &&
      queryParams?.sortBy == "created_at" && { order_by: queryParams.sortBy }),
  }).toString()

  const response = await fetch(`${API_BASE_URL}/products?${queryString}`)

  const data: ProductsResponse = await response.json()

  const nextPage =
    data.data.products.current_page < data.data.products.data.length
      ? validPageParam + 1
      : null

  const sortedProducts = (function getSortedProducts() {
    if (queryParams?.sortBy) {
      return sortProducts(
        data.data.products.data,
        queryParams?.sortBy as SortOptions
      )
    } else {
      return data.data.products.data
    }
  })()

  return {
    response: {
      products: sortedProducts,
      count: sortedProducts.length,
    },
    nextPage,
    queryParams,
  }
}
