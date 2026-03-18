'use client'

import {
  linkifyAssistantText,
  type AssistantCatalogLinkIndex,
  type AssistantLinkKind,
} from '@/lib/assistant/catalog'
import {cn} from '@/lib/utils'
import {marked, type Token, type Tokens} from 'marked'
import Link from 'next/link'
import {Fragment, useMemo, type ReactNode} from 'react'

const INTERNAL_HOSTS = new Set(['rapidfirenow.com', 'www.rapidfirenow.com'])
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

function getSafeAssistantHref(href: string): string | null {
  if (!href) return null

  if (href.startsWith('/') || href.startsWith('#')) {
    return href
  }

  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href
  }

  try {
    const url = new URL(href)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

function getInternalAssistantHref(href: string): string | null {
  const safeHref = getSafeAssistantHref(href)
  if (!safeHref) return null

  if (safeHref.startsWith('/')) {
    return safeHref
  }

  if (safeHref.startsWith('#')) {
    return safeHref
  }

  try {
    const url = new URL(safeHref)
    if (!INTERNAL_HOSTS.has(url.hostname)) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return null
  }
}

function renderAssistantAnchor({
  children,
  href,
  key,
  kind,
  title,
}: {
  children: ReactNode
  href: string
  key: string
  kind?: AssistantLinkKind
  title?: string | null
}) {
  const safeHref = getSafeAssistantHref(href)
  if (!safeHref) {
    return <Fragment key={key}>{children}</Fragment>
  }

  const internalHref = getInternalAssistantHref(safeHref)
  const className =
    'text-brand font-semibold hover:underline decoration-1 decoration-dotted underline-offset-4 transition-opacity hover:opacity-80'

  if (internalHref && !internalHref.startsWith('#')) {
    return (
      <Link
        key={key}
        href={internalHref}
        className={className}
        title={title ?? undefined}
        data-assistant-link-kind={kind}>
        {children}
      </Link>
    )
  }

  if (safeHref.startsWith('#')) {
    return (
      <a
        key={key}
        href={safeHref}
        className={className}
        title={title ?? undefined}
        data-assistant-link-kind={kind}>
        {children}
      </a>
    )
  }

  if (safeHref.startsWith('mailto:') || safeHref.startsWith('tel:')) {
    return (
      <a
        key={key}
        href={safeHref}
        className={className}
        title={title ?? undefined}
        data-assistant-link-kind={kind}>
        {children}
      </a>
    )
  }

  return (
    <a
      key={key}
      href={safeHref}
      target='_blank'
      rel='noreferrer'
      className={className}
      title={title ?? undefined}
      data-assistant-link-kind={kind}>
      {children}
    </a>
  )
}

function renderText(
  text: string,
  linkIndex: AssistantCatalogLinkIndex | null,
  keyPrefix: string,
  enableCatalogLinks: boolean,
): ReactNode[] {
  const segments = enableCatalogLinks
    ? linkifyAssistantText(text, linkIndex)
    : [{type: 'text' as const, text}]

  return segments.map((segment, index) => {
    const key = `${keyPrefix}-segment-${index}`

    if (segment.type === 'text') {
      return <Fragment key={key}>{segment.text}</Fragment>
    }

    return renderAssistantAnchor({
      children: segment.text,
      href: segment.href,
      key,
      kind: segment.kind,
    })
  })
}

function renderInlineTokens(
  tokens: Token[],
  linkIndex: AssistantCatalogLinkIndex | null,
  keyPrefix: string,
  enableCatalogLinks = true,
): ReactNode[] {
  const nodes: ReactNode[] = []

  for (const [index, token] of tokens.entries()) {
    const key = `${keyPrefix}-${index}`
    let nextNodes: ReactNode[]

    switch (token.type) {
      case 'br':
        nextNodes = [<br key={key} />]
        break
      case 'codespan':
        nextNodes = [<code key={key}>{token.text}</code>]
        break
      case 'del':
        nextNodes = [
          <del key={key}>
            {renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-del`,
              enableCatalogLinks,
            )}
          </del>,
        ]
        break
      case 'em':
        nextNodes = [
          <em key={key}>
            {renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-em`,
              enableCatalogLinks,
            )}
          </em>,
        ]
        break
      case 'escape':
        nextNodes = [<Fragment key={key}>{token.text}</Fragment>]
        break
      case 'html':
        nextNodes = [<Fragment key={key}>{token.text}</Fragment>]
        break
      case 'image':
        nextNodes = [
          renderAssistantAnchor({
            children: token.text || token.href,
            href: token.href,
            key,
            title: token.title,
          }),
        ]
        break
      case 'link':
        nextNodes = [
          renderAssistantAnchor({
            children: renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-link`,
              false,
            ),
            href: token.href,
            key,
            title: token.title,
          }),
        ]
        break
      case 'strong':
        nextNodes = [
          <strong key={key}>
            {renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-strong`,
              enableCatalogLinks,
            )}
          </strong>,
        ]
        break
      case 'text':
        if (token.tokens && token.tokens.length > 0) {
          nextNodes = renderInlineTokens(
            token.tokens,
            linkIndex,
            `${key}-text`,
            enableCatalogLinks,
          )
          break
        }

        nextNodes = renderText(token.text, linkIndex, key, enableCatalogLinks)
        break
      default:
        nextNodes = [<Fragment key={key}>{token.raw}</Fragment>]
        break
    }

    nodes.push(...nextNodes)
  }

  return nodes
}

function renderTable(
  token: Tokens.Table,
  linkIndex: AssistantCatalogLinkIndex | null,
  key: string,
) {
  return (
    <div key={key} className='my-3 overflow-x-auto'>
      <table className='min-w-full border-collapse text-sm'>
        <thead>
          <tr>
            {token.header.map((cell, index) => (
              <th
                key={`${key}-header-${index}`}
                className='border-b border-current/15 px-2 py-1 text-left font-semibold'>
                {renderInlineTokens(
                  cell.tokens,
                  linkIndex,
                  `${key}-header-${index}`,
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${key}-row-${rowIndex}-cell-${cellIndex}`}
                  className='border-b border-current/10 px-2 py-1 align-top'>
                  {renderInlineTokens(
                    cell.tokens,
                    linkIndex,
                    `${key}-row-${rowIndex}-cell-${cellIndex}`,
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderBlockTokens(
  tokens: Token[],
  linkIndex: AssistantCatalogLinkIndex | null,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = []

  for (const [index, token] of tokens.entries()) {
    const key = `${keyPrefix}-${index}`
    let nextNodes: ReactNode[]

    switch (token.type) {
      case 'blockquote':
        nextNodes = [
          <blockquote key={key}>
            {renderBlockTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-blockquote`,
            )}
          </blockquote>,
        ]
        break
      case 'code':
        nextNodes = [
          <pre key={key}>
            <code>{token.text}</code>
          </pre>,
        ]
        break
      case 'heading': {
        const HeadingTag = HEADING_TAGS[Math.min(token.depth, 6) - 1]

        nextNodes = [
          <HeadingTag key={key} className='font-semibold'>
            {renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-heading`,
            )}
          </HeadingTag>,
        ]
        break
      }
      case 'hr':
        nextNodes = [<hr key={key} className='my-4 border-current/15' />]
        break
      case 'html':
        nextNodes = [<p key={key}>{token.text}</p>]
        break
      case 'list': {
        const listToken = token as Tokens.List
        const ListTag = listToken.ordered ? 'ol' : 'ul'

        nextNodes = [
          <ListTag
            key={key}
            start={
              listToken.ordered && listToken.start !== ''
                ? listToken.start
                : undefined
            }>
            {listToken.items.map((item: Tokens.ListItem, itemIndex: number) => (
              <li key={`${key}-item-${itemIndex}`}>
                {renderBlockTokens(
                  item.tokens,
                  linkIndex,
                  `${key}-item-${itemIndex}`,
                )}
              </li>
            ))}
          </ListTag>,
        ]
        break
      }
      case 'paragraph':
        nextNodes = [
          <p key={key}>
            {renderInlineTokens(
              token.tokens ?? [],
              linkIndex,
              `${key}-paragraph`,
            )}
          </p>,
        ]
        break
      case 'space':
        nextNodes = []
        break
      case 'table':
        nextNodes = [renderTable(token as Tokens.Table, linkIndex, key)]
        break
      case 'text':
        if (token.tokens && token.tokens.length > 0) {
          nextNodes = [
            <p key={key}>
              {renderInlineTokens(token.tokens, linkIndex, `${key}-text`)}
            </p>,
          ]
          break
        }

        nextNodes = [
          <p key={key}>{renderText(token.text, linkIndex, key, true)}</p>,
        ]
        break
      default:
        nextNodes = [<p key={key}>{token.raw}</p>]
        break
    }

    nodes.push(...nextNodes)
  }

  return nodes
}

export function AssistantMarkdown({
  content,
  linkIndex,
}: {
  content: string
  linkIndex: AssistantCatalogLinkIndex | null
}) {
  const tokens = useMemo(
    () =>
      marked.lexer(content, {
        gfm: true,
        breaks: true,
      }),
    [content],
  )

  const rendered = useMemo(
    () => renderBlockTokens(tokens, linkIndex, 'assistant-markdown'),
    [linkIndex, tokens],
  )

  return (
    <div
      className={cn(
        'text-sm md:text-base leading-relaxed wrap-break-words',
        '[&_p]:m-0 [&_p+p]:mt-3',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-1',
        '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/10 [&_pre]:p-3',
        '[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5',
        '[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
      )}>
      {rendered}
    </div>
  )
}
