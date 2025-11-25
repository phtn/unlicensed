import type {MDXComponents} from 'mdx/types'
import Link from 'next/link'
import React, {type ComponentPropsWithoutRef} from 'react'

type HeadingProps = ComponentPropsWithoutRef<'h1'> & {id?: string}
type ParagraphProps = ComponentPropsWithoutRef<'p'>
type ListProps = ComponentPropsWithoutRef<'ul'>
type ListItemProps = ComponentPropsWithoutRef<'li'>
type AnchorProps = ComponentPropsWithoutRef<'a'>
type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'>

// Helper function to generate slug from text
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Helper to extract text from React children
const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (typeof children === 'boolean' || children == null) return ''
  if (Array.isArray(children)) {
    return children.map(extractText).join(' ')
  }
  if (typeof children === 'object' && 'props' in children) {
    const props = children.props as {children?: React.ReactNode}
    return extractText(props.children)
  }
  return ''
}

const components = {
  h1: ({children, id, ...props}: HeadingProps) => {
    const text = extractText(children)
    const headingId = id || slugify(text)
    return (
      <h1 id={headingId} className='font-bold pt-12 mb-0 text-3xl' {...props}>
        {children}
      </h1>
    )
  },
  h2: ({children, id, ...props}: HeadingProps) => {
    const text = extractText(children)
    const headingId = id || slugify(text)
    return (
      <h2
        id={headingId}
        className='mb-4 mt-6 text-2xl font-normal font-figtree tracking-tighter'
        {...props}>
        {children}
      </h2>
    )
  },
  h3: ({children, id, ...props}: HeadingProps) => {
    const text = extractText(children)
    const headingId = id || slugify(text)
    return (
      <h3
        id={headingId}
        className='text-gray-800 dark:text-zinc-200 font-medium mt-8 mb-3'
        {...props}>
        {children}
      </h3>
    )
  },
  h4: ({children, id, ...props}: HeadingProps) => {
    const text = extractText(children)
    const headingId = id || slugify(text)
    return (
      <h4 id={headingId} className='font-medium' {...props}>
        {children}
      </h4>
    )
  },
  p: (props: ParagraphProps) => (
    <p
      className='font-figtree my-8 text-justify dark:opacity-70 leading-relaxed'
      {...props}
    />
  ),
  ol: (props: ListProps) => (
    <ol
      className='my-8 text-gray-800 dark:text-zinc-300 list-decimal pl-5 space-y-2'
      {...props}
    />
  ),
  ul: (props: ListProps) => (
    <ul
      className='my-8 text-gray-800 dark:text-zinc-300 list-disc pl-5 space-y-1'
      {...props}
    />
  ),
  li: (props: ListItemProps) => <li className='pl-1' {...props} />,
  em: (props: ComponentPropsWithoutRef<'em'>) => (
    <em className='font-medium' {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong
      className='ml-2 font-bold font-figtree text-2xl md:text-3xl'
      {...props}
    />
  ),
  a: ({href, children, ...props}: AnchorProps) => {
    const className =
      'text-blue-500 hover:text-blue-700 dark:text-gray-400 hover:dark:text-gray-300 dark:underline dark:underline-offset-2 dark:decoration-gray-800'
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )
    }
    if (href?.startsWith('#')) {
      return (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      )
    }
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={className}
        {...props}>
        {children}
      </a>
    )
  },
  Table: ({data}: {data: {headers: string[]; rows: string[][]}}) => (
    <table>
      <thead>
        <tr>
          {data.headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  blockquote: (props: BlockquoteProps) => (
    <blockquote
      className='my-8 ml-[0.075em] border-l-3 border-gray-300 pl-4 text-gray-700 dark:border-zinc-600 dark:text-zinc-300'
      {...props}
    />
  ),
}

declare global {
  type MDXProvidedComponents = typeof components
}

export const useMDXComponents = (extras?: MDXComponents): MDXComponents => ({
  ...components,
  ...extras,
})

export {components}
