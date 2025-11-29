import type {Metadata} from 'next'
import {Content} from './content'

export async function generateMetadata({
  params,
}: {
  params: Promise<{orderNumber: string}>
}): Promise<Metadata> {
  const orderNumber = (await params).orderNumber
  return {
    title: `Order ${orderNumber} | Admin | Unlicensed`,
    description: `View order details for order ${orderNumber}.`,
  }
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{orderNumber: string}>
}) {
  const orderNumber = (await params).orderNumber
  return <Content orderNumber={orderNumber} />
}




