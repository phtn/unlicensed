import {useEffect, useState} from 'react'

export interface Heading {
  id: string
  text: string
  level: number
}

export function useHeadings() {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const slugify = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    const extractHeadings = () => {
      // Only look in the main content area to avoid header/footer headings
      const mainContent = document.querySelector('main')
      if (!mainContent) return

      const headingElements = mainContent.querySelectorAll('h1, h2, h3, h4')
      const extracted: Heading[] = []

      headingElements.forEach((element) => {
        const text = element.textContent?.trim() || ''
        if (!text) return

        // Use existing ID or generate one from text
        let id = element.id
        if (!id) {
          id = slugify(text)
          element.id = id
        }

        const tagName = element.tagName.toLowerCase()
        const level = parseInt(tagName.replace('h', ''), 10)

        extracted.push({id, text, level})
      })

      setHeadings(extracted)
    }

    // Extract headings after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(extractHeadings, 300)
    
    // Also listen for content changes
    const observer = new MutationObserver(() => {
      setTimeout(extractHeadings, 100)
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return headings
}
