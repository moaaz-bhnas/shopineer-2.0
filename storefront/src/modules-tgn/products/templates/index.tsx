import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { Product, Image } from "@lib/data-tgn/products"
import { Locale } from "@lib/data-tgn/locales"
import ProductInfo from "./product-info"
import ProductTabs from "../components/product-tabs"
import { IMAGE_BASE_URL } from "@lib/constants"
import ProductActions from "../components/product-actions"

type ProductTemplateProps = {
  product: Product
  images: Image[]
  locale: Locale
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  images,
  locale,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  console.log("🕊️😂🕊️", product)

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <ProductInfo product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative">
          <ImageGallery
            images={images.map((image) => `${IMAGE_BASE_URL}/${image.path}`)}
          />
        </div>
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          <Suspense
            fallback={<ProductActions disabled={true} product={product} />}
          >
            <ProductActionsWrapper handle={product.slug} />
          </Suspense>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        {/* <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense> */}
      </div>
    </>
  )
}

export default ProductTemplate
