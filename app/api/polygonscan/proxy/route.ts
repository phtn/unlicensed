import {NextRequest, NextResponse} from 'next/server'

/**
 * Proxy API route for PolygonScan requests
 * This bypasses CORS restrictions by making the request server-side
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

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

    // Only allow PolygonScan URLs for security
    if (
      parsedUrl.hostname !== 'polygonscan.com' &&
      parsedUrl.hostname !== 'www.polygonscan.com'
    ) {
      return NextResponse.json(
        {error: 'Only PolygonScan URLs are allowed'},
        {status: 400},
      )
    }

    // Only allow HTTPS URLs for security
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        {error: 'Only HTTPS URLs are allowed'},
        {status: 400},
      )
    }

    // Fetch from PolygonScan
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/html, */*',
        'User-Agent': 'PolygonScan-Proxy/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const contentType = response.headers.get('content-type') || ''
    let data: unknown

    if (contentType.includes('application/json')) {
      data = await response.json()
    } else if (contentType.includes('text/html')) {
      const html = await response.text()
      data = {
        type: 'html',
        content: html,
        message:
          'This endpoint returns an HTML page. The content has been fetched successfully.',
      }
    } else {
      data = await response.text()
    }

    return NextResponse.json(
      {
        success: response.ok,
        data,
        url,
      },
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    )
  } catch (error) {
    console.error('Error proxying PolygonScan request:', error)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout',
            url: request.nextUrl.searchParams.get('url') || '',
          },
          {
            status: 408,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          url: request.nextUrl.searchParams.get('url') || '',
        },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        url: request.nextUrl.searchParams.get('url') || '',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

