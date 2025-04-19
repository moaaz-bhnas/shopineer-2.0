// Base URL for the Marie M Hijab API

import { API_BASE_URL } from "../constants"
import { sortProducts } from "../util-tgn/sort-products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// Types for the API responses
interface ProductTranslation {
  id: number
  product_id: number
  title: string
  description: string
  product_attributes: any
  locale: string
}

interface CategoryTranslation {
  id: number
  category_id: number
  name: string
  locale: string
}

interface Category {
  id: number
  parent_id: number | null
  active: number
  created_at: string
  updated_at: string
  name: string
  translations: CategoryTranslation[]
}

export interface Image {
  id: number
  title: string
  path: string
  size: string
  type: string
  extension: string
  user_id: number
  external_link: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  images: string[]
  thumbnail_img: string
  stock: number
  min_stock: number
  meta_keywords: string
  meta_description: string
  sku: string
  slug: string
  price: number
  discount: number
  discount_type: string
  recomended: number
  active: number
  category_id: number
  created_at: string
  updated_at: string
  selling_count: string
  final_price: number
  title: string
  description: string
  product_attributes: any
  thumbnail: Image
  category: Category
  variants: any[]
  translations: ProductTranslation[]
}

interface ProductDetailResponse {
  product: Product
  images: Image[]
  attributes: any[]
  combinations: any[]
  message: string
}

interface PaginationMeta {
  current_page: number
  data: Product[]
}

interface ProductsResponse {
  success: boolean
  status_code: number
  data: {
    products: PaginationMeta
  }
}

interface ProductResponse {
  success: boolean
  status_code: number
  data: ProductDetailResponse
  message: string
}

export async function getProductById(
  id: string
): Promise<ProductResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`)
  const data: ProductResponse = await response.json()
  return data.data
}

export async function getProductsList({
  pageParam = 1,
  queryParams,
}: {
  pageParam?: number
  queryParams?: {
    category_id?: string
    search?: string
    select?: string
    active?: boolean
    recommended?: boolean
    locale?: string
  }
}): Promise<{
  response: { products: Product[]; count: number }
  nextPage: number | null
  queryParams?: any
}> {
  const validPageParam = Math.max(pageParam, 1)

  const queryString = new URLSearchParams({
    page: validPageParam.toString(),
    ...(queryParams?.category_id && { category_id: queryParams.category_id }),
    ...(queryParams?.search && { search: queryParams.search }),
    ...(queryParams?.select && { select: queryParams.select }),
    ...(queryParams?.active && { active: "1" }),
    ...(queryParams?.recommended && { recommended: "1" }),
    ...(queryParams?.locale && { lang: queryParams.locale }),
  }).toString()

  const response = await fetch(`${API_BASE_URL}/products?${queryString}`)

  const data: ProductsResponse = await response.json()

  const nextPage =
    data.data.products.current_page < data.data.products.data.length
      ? validPageParam + 1
      : null

  return {
    response: {
      products: data.data.products.data,
      count: data.data.products.data.length,
    },
    nextPage,
    queryParams,
  }
}

export async function getProductsListWithSort({
  page = 0,
  queryParams,
  sortBy = "created_at",
}: {
  page?: number
  queryParams?: {
    category_id?: string
    search?: string
    select?: string
    active?: boolean
    recommended?: boolean
  }
  sortBy?: SortOptions
}): Promise<{
  response: { products: Product[]; count: number }
  nextPage: number | null
  queryParams?: any
}> {
  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
    },
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * 12 // Using fixed limit of 12 as per original implementation
  const nextPage = count > pageParam + 12 ? pageParam + 12 : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + 12)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
