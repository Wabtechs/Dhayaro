'use client'

import { MarkdownRenderer } from '@/components/markdown-renderer'
import { HelpImageUpload } from '@/components/help/help-image-upload'
import { docsContent } from '@/content/docs/content'

export default function DocsPage() {
  return (
    <>
      {docsContent.map((section) => (
        <section key={section.id} id={section.id}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
            {section.title}
          </h3>
          <MarkdownRenderer>{section.markdown}</MarkdownRenderer>
          <HelpImageUpload location={section.docKey} altText={`Illustration : ${section.title}`} />
        </section>
      ))}
    </>
  )
}
