import type {Metadata} from 'next'
import {Content} from './content'

export async function generateMetadata({
  params,
}: {
  params: Promise<{firebaseId: string}>
}): Promise<Metadata> {
  const firebaseId = (await params).firebaseId

  return {
    title: `Customer ${firebaseId} | Admin | Unlicensed`,
    description: `View customer profile for ${firebaseId}.`,
  }
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{firebaseId: string}>
}) {
  const firebaseId = (await params).firebaseId

  return <Content firebaseId={firebaseId} />
}
