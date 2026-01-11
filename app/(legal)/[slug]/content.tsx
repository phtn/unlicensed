'use client'
import {legalDocuments} from '@/legal/documents'
import {Privacy, Purchase, Tos} from '@/legal'
import {components} from '@/mdx.components'
import {RemoteMDXRenderer} from '@/lib/remote-mdx-renderer'
import {type JSX, useCallback, useEffect} from 'react'
import {SpaceX} from '../_components/spacex'

export const Content = ({slug}: {slug: string}) => {
  const fetchDoc = useCallback(
    async () => await import(`@/legal/${slug}.mdx`),
    [slug],
  )

  const doc = legalDocuments.find((d) => d.slug === slug)
  const isRemote = doc?.remoteSource

  const docMap: Record<string, JSX.Element> = {
    'terms-of-use': <Tos components={components} />,
    'privacy-policy': <Privacy components={components} />,
    'purchase-agreement': <Purchase components={components} />,
  }

  useEffect(() => {
    if (!isRemote) {
      fetchDoc().then((doc) => {
        console.log(doc)
      })
    }
  }, [fetchDoc, isRemote])

  return (
    <main className='h-screen overflow-y-scroll'>
      <SpaceX />
      {isRemote ? (
        <RemoteMDXRenderer url={doc.remoteSource!} />
      ) : (
        docMap[slug]
      )}
      <SpaceX />
    </main>
  )
}
