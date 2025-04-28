import { Metadata } from "next"
import { notFound } from "next/navigation"

// import ProductTemplate from "@modules/products/templates"
// import { getRegion, listRegions } from "@lib/data/regions"
// import { getProductByHandle, getProductsList } from "@lib/data/products"
import { Locale } from "@lib/data-tgn/locales"
import { getProductsList, getProductBySlug } from "@lib/data-tgn/products"
import { IMAGE_BASE_URL } from "@lib/constants"
import ProductTemplate from "modules-tgn/products/templates"

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  //   const countryCodes = await listRegions().then(
  //     (regions) =>
  //       regions
  //         ?.map((r) => r.countries?.map((c) => c.iso_2))
  //         .flat()
  //         .filter(Boolean) as string[]
  //   )

  //   if (!countryCodes) {
  //     return null
  //   }

  const products = await Promise.all(
    Object.values(Locale).map((locale) => {
      return getProductsList({
        queryParams: { locale: "en" /*select: "id,title,slug" */ },
      })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = Object.values(Locale)
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: String(product.slug),
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  //   const { handle } = params
  const { handle } = params
  //   const region = await getRegion(params.countryCode)

  // if (!region) {
  //     notFound()
  // }

  const product = (await getProductBySlug(handle)).product

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Medusa Store`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Medusa Store`,
      description: `${product.title}`,
      images: product.thumbnail
        ? [`${IMAGE_BASE_URL}/${product.thumbnail}`]
        : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const productData = await getProductBySlug(params.handle)

  if (!productData.product) {
    notFound()
  }

  //   const region = await getRegion(params.countryCode)

  //   if (!region) {
  //     notFound()
  //   }

  //   const pricedProduct = await getProductByHandle(params.handle, region.id)
  //   if (!pricedProduct) {
  //     notFound()
  //   }

  return (
    <ProductTemplate
      product={productData.product}
      images={productData.images}
      locale={params.countryCode as Locale}
      //   region={region}
      //   countryCode={params.countryCode}
    />
  )
}
