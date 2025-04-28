"use server"

import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { setCartId, getAuthHeaders, getCartId } from "./cookies"
import { API_BASE_URL } from "@lib/constants"
import {
  CartItemRequest,
  CreateCartResponse,
  RetrieveCartResponse,
  UpdateCartResponse,
} from "../types"

// Cart Operations
export async function createCart(
  data: CartItemRequest
): Promise<CreateCartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })
    const result: CreateCartResponse = await response.json()
    if (result.success && result.data.cart_item) {
      setCartId(String(result.data.cart_item.cart_id))
      revalidateTag("cart")
    }
    return result
  } catch (error) {
    throw medusaError(error)
  }
}

export async function retrieveCart(): Promise<RetrieveCartResponse | null> {
  const cartId = getCartId()
  if (!cartId) return null

  try {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
      headers: getAuthHeaders(),
    })
    const result: RetrieveCartResponse = await response.json()
    return result.success ? result : null
  } catch (error) {
    return null
  }
}

export async function updateLineItem(data: {
  cartItemId: number
  qty: number
}): Promise<UpdateCartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/carts/${data.cartItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ qty: data.qty }),
    })
    const result: UpdateCartResponse = await response.json()
    revalidateTag("cart")
    return result
  } catch (error) {
    throw medusaError(error)
  }
}

export async function addToCart(
  product_id: number,
  product_variant_id: number,
  qty: number
): Promise<CreateCartResponse | UpdateCartResponse> {
  // Check if cart exists
  const cart = await retrieveCart()

  if (!cart) {
    // If no cart exists, create a new one with the item
    return createCart({
      product_id,
      product_variant_id,
      qty,
    })
  }

  // Check if the variant already exists in the cart
  const existingItem = cart.data.cart.cart_items.find(
    (item) => item.product_variant_id === product_variant_id
  )

  if (existingItem) {
    // If variant exists, update its quantity
    return updateLineItem({
      cartItemId: existingItem.id,
      qty,
    })
  }

  // TODO: Handle case where cart exists but item is not in cart
  // This would require adding a new item to an existing cart
  throw new Error("Adding new items to existing cart is not implemented yet")
}
