'use client'

import {Editor} from '@/components/ui/editor'
import {api} from '@/convex/_generated/api'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {ensureSlug} from '@/lib/slug'
import {Button, Image, Input, Select, SelectItem, Textarea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {ArrowLeft, Save, Upload} from 'lucide-react'
import Link from 'next/link'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

type BlogPostStatus = 'draft' | 'published' | 'archived'

export default function BlogEditorPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const isNew = slug === 'create' || slug === 'new'

  // Queries
  const existingBlog = useQuery(api.blogs.q.getBySlug, isNew ? 'skip' : {slug})
  const createBlog = useMutation(api.blogs.m.create)
  const updateBlog = useMutation(api.blogs.m.update)

  // State
  const [title, setTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [tags, setTags] = useState<string>('') // comma sep
  const [flags, setFlags] = useState<string>('') // comma sep
  const [status, setStatus] = useState<BlogPostStatus>('draft')

  const {uploadFile, isUploading} = useStorageUpload()

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (existingBlog) {
      setTitle(existingBlog.title)
      setPostSlug(existingBlog.slug)
      setContent(existingBlog.content)
      setExcerpt(existingBlog.excerpt)
      setCoverImage(existingBlog.coverImage || null)
      setTags(existingBlog.tags.join(', '))
      setFlags(existingBlog.flags?.join(', ') || '')
      setStatus(existingBlog.status)
    }
  }, [existingBlog])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const {url} = await uploadFile(file)
      if (url) setCoverImage(url)
    }
  }

  const handleSubmit = async () => {
    if (!title) return alert('Title is required')

    setIsSaving(true)
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
    const flagsArray = flags
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f)

    const finalSlug = ensureSlug(postSlug || title, '')
    if (!finalSlug) return alert('Slug is required')

    const payload = {
      title,
      slug: finalSlug,
      content,
      excerpt,
      coverImage: coverImage || undefined,
      tags: tagsArray,
      flags: flagsArray.length > 0 ? flagsArray : undefined,
      status,
    }

    try {
      if (isNew) {
        await createBlog(payload)
      } else {
        if (!existingBlog) return
        await updateBlog({
          id: existingBlog._id,
          patch: payload,
        })
      }
      router.push('/admin/blog')
    } catch (err) {
      console.error(err)
      alert(
        'Failed to save: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isNew && existingBlog === undefined) {
    return <div className='p-8'>Loading...</div>
  }

  return (
    <div className='max-w-7xl mx-auto p-4 pb-32'>
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <Link href='/admin/blog'>
            <Button variant='ghost' isIconOnly>
              <ArrowLeft className='w-5 h-5' />
            </Button>
          </Link>
          <h1 className='text-3xl font-bold tracking-tight'>
            {isNew ? 'Create Post' : 'Edit Post'}
          </h1>
        </div>
        <Button color='primary' onPress={handleSubmit} isLoading={isSaving}>
          <Save className='w-4 h-4 mr-2' />
          Save
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='space-y-2'>
            <Input
              label='Title'
              placeholder='Post Title'
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!slugManuallyEdited && isNew) {
                  setPostSlug(ensureSlug(e.target.value, ''))
                }
              }}
              variant='bordered'
              classNames={{
                label: 'font-semibold opacity-75 mb-2',
              }}
            />
          </div>

          <div className='space-y-2'>
            <Input
              label='Slug'
              placeholder='post-slug'
              value={postSlug}
              onChange={(e) => {
                setPostSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              description='URL-friendly version of the title.'
              variant='bordered'
              classNames={{
                label: 'font-semibold opacity-75 mb-2',
              }}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground/60'>
              Content
            </label>
            <div className='overflow-hidden'>
              <Editor
                value={content}
                onChange={setContent}
                placeholder='Write your post content here...'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Textarea
              label='Excerpt'
              placeholder='Short summary for previews...'
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              minRows={3}
              variant='bordered'
            />
          </div>
        </div>

        <div className='space-y-6'>
          <div className='p-4 border rounded-lg bg-content1 space-y-4'>
            <h3 className='font-semibold'>Publishing</h3>
            <Select
              label='Status'
              selectedKeys={[status]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as BlogPostStatus
                if (selectedKey) setStatus(selectedKey)
              }}>
              <SelectItem key='draft' textValue='Draft'>
                Draft
              </SelectItem>
              <SelectItem key='published' textValue='Published'>
                Published
              </SelectItem>
              <SelectItem key='archived' textValue='Archived'>
                Archived
              </SelectItem>
            </Select>
          </div>

          <div className='p-4 border rounded-lg bg-content1 space-y-4'>
            <h3 className='font-semibold'>Cover Image</h3>
            {coverImage && (
              <div className='relative aspect-video rounded-lg overflow-hidden mb-2'>
                <Image
                  src={coverImage}
                  alt='Cover'
                  className='w-full h-full object-cover'
                />
              </div>
            )}
            <div className='flex items-center gap-2'>
              <Button
                as='label'
                variant='bordered'
                isLoading={isUploading}
                className='w-full cursor-pointer'>
                <Upload className='w-4 h-4 mr-2' />
                {coverImage ? 'Change Image' : 'Upload Image'}
                <input
                  type='file'
                  className='hidden'
                  accept='image/*'
                  onChange={handleImageUpload}
                />
              </Button>
            </div>
          </div>

          <div className='p-4 border rounded-lg bg-content1 space-y-4'>
            <h3 className='font-semibold'>Metadata</h3>
            <Input
              label='Tags'
              placeholder='news, tutorial, update'
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              description='Comma separated tags'
              variant='bordered'
              classNames={{
                label: 'font-semibold opacity-75 mb-2',
              }}
            />
            <Input
              disabled
              label='Feature Flags'
              placeholder='feature_flag_key'
              classNames={{
                label: 'font-semibold opacity-75 mb-2',
              }}
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              description='Required flags to view this post (comma separated)'
              variant='bordered'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
