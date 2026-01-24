import {compile} from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkToc from 'remark-toc'
import rehypeSlug from 'rehype-slug'
import {NextRequest, NextResponse} from 'next/server'
import {after} from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const {url} = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {error: 'Invalid URL provided'},
        {status: 400},
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({error: 'Invalid URL format'}, {status: 400})
    }

    // Only allow HTTPS URLs for security
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        {error: 'Only HTTPS URLs are allowed'},
        {status: 400},
      )
    }

    // Fetch the remote MDX content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MDX-Fetcher/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        {error: `Failed to fetch: ${response.statusText}`},
        {status: response.status},
      )
    }

    const mdxContent = await response.text()

    if (!mdxContent) {
      return NextResponse.json(
        {error: 'Empty content received'},
        {status: 400},
      )
    }

    // Compile MDX on the server
    const compiled = await compile(mdxContent, {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm, remarkToc],
      rehypePlugins: [rehypeSlug],
      jsxImportSource: 'react',
      development: false,
    })

    return NextResponse.json({
      content: String(compiled),
      source: url,
    })
  } catch (error) {
    // Log error after response is sent (non-blocking)
    after(async () => {
      console.error('Error fetching remote MDX:', error)
    })
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {error: 'Request timeout'},
          {status: 408},
        )
      }
      return NextResponse.json(
        {error: error.message},
        {status: 500},
      )
    }

    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500},
    )
  }
}
