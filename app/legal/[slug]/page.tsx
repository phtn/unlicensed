import {legalDocuments} from '@/legal/documents'
import {Metadata} from 'next'
import {Content} from './content'

interface PageProps {
  params: Promise<{slug: string}>
}
export async function generateStaticParams() {
  return legalDocuments.map((doc) => ({
    slug: doc.slug,
  }))
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const slug = (await params).slug
  const doc = legalDocuments.find((d) => d.slug === slug)

  if (!doc) {
    return {}
  }

  return {
    title: doc.title,
    description: doc.description,
  }
}

export default async function Page({params}: PageProps) {
  const slug = (await params).slug

  return <Content slug={slug} />
}
