'use client'

import {components} from '@/mdx.components'
import {useRemoteMDX} from '@/hooks/use-remote-mdx'
import {MDXProvider, useMDXComponents} from '@mdx-js/react'
import {useEffect, useState} from 'react'
import React from 'react'

interface RemoteMDXRendererProps {
  url: string
  fallback?: React.ReactNode
  errorFallback?: (error: string) => React.ReactNode
}

export function RemoteMDXRenderer({
  url,
  fallback,
  errorFallback,
}: RemoteMDXRendererProps) {
  const {content, loading, error} = useRemoteMDX(url)
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const mdxComponents = useMDXComponents(components)

  useEffect(() => {
    // Evaluate the compiled MDX function body
    const evaluateMDX = () => {
      if (!content) {
        setComponent(null)
        return
      }

      try {
        // The content from @mdx-js/mdx compile() is a function body
        // that expects React.createElement and components
        // We'll use Function constructor to evaluate it safely
         
        const fn = new Function(
          'React',
          'components',
          `
          const {createElement: _jsx, Fragment: _Fragment} = React;
          ${content}
          // The compiled MDX exports _content as the default
          return typeof _content === 'function' ? _content : () => _content;
        `,
        )

        const result = fn(React, mdxComponents)
        
        if (typeof result === 'function') {
          setComponent(() => result)
        } else {
          // If it's not a function, wrap it in a component
          setComponent(() => () => result as React.ReactElement)
        }
      } catch (e) {
        console.error('Error evaluating remote MDX:', e)
        setComponent(null)
      }
    }

    evaluateMDX()
  }, [content, mdxComponents])

  if (loading) {
    return (
      fallback || (
        <div className='flex items-center justify-center p-8'>
          <div className='text-muted-foreground'>Loading document...</div>
        </div>
      )
    )
  }

  if (error) {
    return (
      errorFallback?.(error) || (
        <div className='flex items-center justify-center p-8'>
          <div className='text-destructive'>
            Error loading document: {error}
          </div>
        </div>
      )
    )
  }

  if (!Component) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-muted-foreground'>No content available</div>
      </div>
    )
  }

  return (
    <MDXProvider components={mdxComponents}>
      <Component />
    </MDXProvider>
  )
}
