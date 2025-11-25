# Remote MDX Documents

This document explains how to load MDX documents from remote sources.

## Overview

The legal documents system supports loading MDX content from remote URLs. This is useful for:
- Loading documents from a CDN
- Dynamic content updates without redeploying
- Sharing documents across multiple applications
- Content management systems

## Usage

### Adding a Remote Document

To add a remote MDX document, update `legal/documents.ts`:

```typescript
{
  slug: 'remote-document',
  title: 'Remote Document',
  description: 'Document loaded from remote source',
  remoteSource: 'https://example.com/path/to/document.mdx',
}
```

**Important:** 
- Only HTTPS URLs are allowed for security
- The remote URL must return raw MDX content
- The document will be compiled server-side and cached

### How It Works

1. **API Route** (`/api/mdx/remote`):
   - Fetches MDX content from the remote URL
   - Compiles it server-side using `@mdx-js/mdx`
   - Returns the compiled function body

2. **Client Hook** (`useRemoteMDX`):
   - Fetches compiled content from the API route
   - Handles loading and error states

3. **Renderer** (`RemoteMDXRenderer`):
   - Evaluates the compiled MDX
   - Renders it with the same components as local MDX
   - Supports all MDX features (GFM, TOC, etc.)

### Security Considerations

- Only HTTPS URLs are accepted
- 10-second timeout on remote requests
- Server-side compilation prevents XSS
- Content is validated before compilation

### Example Remote MDX File

```mdx
# My Remote Document

This is a document loaded from a remote source.

## Section 1

Content here...

## Section 2

More content...
```

### Error Handling

The system handles:
- Network errors
- Invalid URLs
- Empty responses
- Compilation errors
- Timeouts

Errors are displayed to users with helpful messages.

### Performance

- Remote documents are fetched on-demand
- Compilation happens server-side (faster)
- Content is not cached by default (add caching if needed)
- Consider using a CDN for better performance
