'use client'

import dynamic from 'next/dynamic'
import {useMemo} from 'react'
import 'react-quill-new/dist/quill.snow.css'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const Editor = ({value, onChange, placeholder}: EditorProps) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill-new'), {ssr: false}),
    [],
  )

  const modules = {
    toolbar: [
      [{header: [1, 2, 3, 4, 5, 6, false]}],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{list: 'ordered'}, {list: 'bullet'}, {indent: '-1'}, {indent: '+1'}],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
  ]

  return (
    <div className='bg-background text-foreground [&_.ql-toolbar]:bg-muted [&_.ql-container]:bg-background [&_.ql-container]:text-foreground [&_.ql-editor]:min-h-[300px]'>
      <ReactQuill
        theme='snow'
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className='h-full'
      />
    </div>
  )
}
