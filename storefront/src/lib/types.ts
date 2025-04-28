// Base Types
export interface Media {
  id: number
  title: string
  path: string
  size: string
  type: string
  extension: string
  external_link: string | null
  created_at: string
  updated_at: string
}

export interface ProductAttributes {
  Size: number
  Brand: string
  Color: string
  Origin: string
  Latitude: number
  Longitude: number
}

// Translation Types
export interface ProductTranslation {
  id: number
  product_id: number
  title: string
  description: string
  product_attributes: ProductAttributes
  locale: string
}

export interface CategoryTranslation {
  id: number
  category_id: number
  name: string
  locale: string
}

// Category Types
export interface Category {
  id: number
  parent_id: number | null
  active: number
  created_at: string
  updated_at: string
  name: string
  translations: CategoryTranslation[]
}

// Attribute Types
export interface Attribute {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface AttributeValue {
  id: number
  attribute_id: number
  value: string
  hex: string | null
  created_at: string
  updated_at: string
  pivot: {
    product_variant_id: number
    attribute_value_id: number
  }
  attribute: Attribute
}

// Product Variant Types
export interface ProductVariant {
  id: number
  product_id: number
  sku: string
  price: number
  stock: number
  images: number[]
  created_at: string
  updated_at: string
  images_url: string[]
  attribute_values: AttributeValue[]
}

export interface ProductCombination {
  Color: string
  Size: string
  variant_id: number
  stock: number
  price: number
  images: number[]
}

export interface ProductVariantAttributes {
  Color: Array<{
    value: string
    hex: string
  }>
  Size: Array<{
    value: string
  }>
}

// Product Types
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
  product_attributes: ProductAttributes
  thumbnail: Media
  category: Category
  variants: ProductVariant[]
  translations: ProductTranslation[]
}

// Cart Types
export interface CartItem {
  id: number
  cart_id: number
  product_id: number
  product_variant_id: number
  qyt: number
  product: Product
  variant: ProductVariant
}

export interface Cart {
  id: number
  user_id: number
  guest_token: string | null
  coupon_code: string | null
  created_at: string
  updated_at: string
  cart_items: CartItem[]
  coupon: any | null
}

export interface CartData {
  cart: Cart
  sub_total: number
  total_price: number
  discount: number
  tax: number
  total_items: number
}

// Request Types
export interface CartItemRequest {
  qty: number
  product_id: number
  product_variant_id: number
}

// Response Types
export interface CreateCartResponse {
  success: boolean
  status_code: number
  data: {
    cart_item: {
      cart_id: number
      product_id: number
      product_variant_id: number
      qyt: number
      id: number
    }
  }
  message: string
}

export interface RetrieveCartResponse {
  success: boolean
  status_code: number
  data: CartData
  message: string
}

export interface UpdateCartResponse {
  success: boolean
  status_code: number
  data: {
    cart_item: CartItem
  }
  message: string
}

export interface ProductDetailResponse {
  product: Product
  images: Media[]
  attributes: ProductVariantAttributes
  combinations: ProductCombination[]
  message: string
}

export interface PaginationMeta {
  current_page: number
  data: Product[]
}

export interface ProductsResponse {
  success: boolean
  status_code: number
  data: {
    products: PaginationMeta
  }
}

export interface ProductResponse {
  success: boolean
  status_code: number
  data: ProductDetailResponse
  message: string
}
