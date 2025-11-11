'use client'

import {CategoryContent} from '@/components/base44/category'

interface ContentProps {
  slug: string
}

export const Content = ({slug}: ContentProps) => {
  return <CategoryContent slug={slug} />
}
