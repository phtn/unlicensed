'use client'

import {Id} from '@/convex/_generated/dataModel'
import type {ConversationFolderSummary} from '@/convex/messages/d'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {MouseEvent, SubmitEvent, useEffect, useState} from 'react'

export const ALL_CONVERSATIONS_FOLDER = '__all__'
export const UNFILED_CONVERSATIONS_FOLDER = '__unfiled__'

interface ConversationFolderToolbarProps {
  activeFolderId: string
  counts: {
    all: number
    unfiled: number
    byFolderId: Record<string, number>
  }
  folders: ConversationFolderSummary[]
  onCreateFolder: (name: string) => Promise<void> | void
  onRenameFolder: (
    folderId: Id<'conversationFolders'>,
    name: string,
  ) => Promise<void> | void
  onSelectFolder: (folderId: string) => void
}

export function ConversationFolderToolbar({
  activeFolderId,
  counts,
  folders,
  onCreateFolder,
  onRenameFolder,
  onSelectFolder,
}: ConversationFolderToolbarProps) {
  const [draft, setDraft] = useState('')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingFolder, setEditingFolder] =
    useState<ConversationFolderSummary | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    folder: ConversationFolderSummary
    left: number
    top: number
  } | null>(null)

  useEffect(() => {
    if (!contextMenu) return

    const handleClose = () => {
      setContextMenu(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null)
      }
    }

    window.addEventListener('resize', handleClose)
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleClose)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = draft.trim()
    if (!nextName) return
    if (editingFolder) {
      await onRenameFolder(editingFolder._id, nextName)
      setEditingFolder(null)
    } else {
      await onCreateFolder(nextName)
    }
    setDraft('')
    setIsFormVisible(false)
  }

  const handleFolderContextMenu = (
    event: MouseEvent<HTMLButtonElement>,
    folder: ConversationFolderSummary,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 176
    const viewportPadding = 12
    setContextMenu({
      folder,
      left: Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - menuWidth - viewportPadding),
      ),
      top: Math.min(rect.bottom + 8, window.innerHeight - 64),
    })
  }

  const handleStartRename = () => {
    if (!contextMenu) return
    setEditingFolder(contextMenu.folder)
    setDraft(contextMenu.folder.name)
    setIsFormVisible(true)
    setContextMenu(null)
  }

  const handleCancelEdit = () => {
    setEditingFolder(null)
    setDraft('')
    setIsFormVisible(false)
  }

  const handleToggleForm = () => {
    if (editingFolder) {
      handleCancelEdit()
      return
    }

    setIsFormVisible((current) => {
      const next = !current
      if (!next) {
        setDraft('')
      }
      return next
    })
  }

  const folderChips = [
    {
      id: ALL_CONVERSATIONS_FOLDER,
      label: 'All',
      count: counts.all,
    },
    {
      id: UNFILED_CONVERSATIONS_FOLDER,
      label: 'Unsorted',
      count: counts.unfiled,
    },
  ]

  return (
    <div className='relative border-b border-border/40 bg-background/95 px-3 py-3 supports-backdrop-filter:backdrop-blur-md md:px-4'>
      <div className='flex items-center gap-2'>
        <div className='flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          <div className='flex w-max gap-2'>
            {folderChips.map((folder) => {
              const isActive = activeFolderId === folder.id
              return (
                <button
                  key={folder.id}
                  type='button'
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 bg-background/70 text-muted-foreground hover:text-foreground',
                  )}>
                  <span className='select-none'>{folder.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px]',
                      isActive
                        ? 'bg-background/15 text-inherit'
                        : 'bg-muted text-foreground/70',
                    )}>
                    {folder.count}
                  </span>
                </button>
              )
            })}
            {folders.map((folder) => {
              const folderId = String(folder._id)
              const isActive = activeFolderId === folderId

              return (
                <button
                  key={folderId}
                  type='button'
                  onClick={() => onSelectFolder(folderId)}
                  onContextMenu={(event) =>
                    handleFolderContextMenu(event, folder)
                  }
                  aria-haspopup='menu'
                  title='Right-click to edit folder'
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 bg-background/70 text-muted-foreground hover:text-foreground hover:border-foreground/40',
                  )}>
                  <span>{folder.name}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px]',
                      isActive
                        ? 'bg-background/15 text-inherit'
                        : 'bg-muted text-foreground/70',
                    )}>
                    {counts.byFolderId[folderId] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type='button'
          onClick={handleToggleForm}
          aria-label={isFormVisible ? 'Hide folder form' : 'Show folder form'}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sidebar/60 bg-background/80 text-muted-foreground transition-colors hover:border-sidebar hover:text-foreground',
            isFormVisible && 'border-sidebar text-foreground',
          )}>
          <Icon
            name='plus'
            className={cn('size-4 transition-transform duration-200', {
              'rotate-[112.5deg] text-red-500': isFormVisible,
            })}
          />
        </button>
      </div>

      {isFormVisible && (
        <form
          onSubmit={handleSubmit}
          className='mt-3 flex flex-wrap items-center gap-2'>
          <div className='relative order-1 flex w-full items-center space-x-1 sm:order-0 sm:flex-1'>
            <Icon
              name='open-folder'
              className='pointer-events-none size-4 text-muted-foreground'
            />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={editingFolder ? 'Rename folder' : 'New folder'}
              className='h-9 w-full rounded-full border border-border/60 bg-background pl-3 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/50'
              maxLength={40}
            />
          </div>
          <button
            type='submit'
            disabled={!draft.trim()}
            className='order-2 inline-flex h-8 w-auto aspect-square flex-1 items-center justify-center rounded-full border border-border/60 px-3 text-sm transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 sm:order-0 sm:flex-none bg-emerald-500/10'>
            <Icon name='check' className='size-4' />
          </button>
          {editingFolder && (
            <button
              type='button'
              onClick={handleCancelEdit}
              className='order-2 inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-border/60 px-3 text-sm transition-colors hover:border-foreground/40 sm:order-0 sm:flex-none'>
              <span>Cancel</span>
            </button>
          )}
        </form>
      )}

      {contextMenu && (
        <>
          <button
            type='button'
            aria-label='Close folder menu'
            onClick={() => setContextMenu(null)}
            className='fixed inset-0 z-40 cursor-default'
          />
          <div
            role='menu'
            aria-label={`${contextMenu.folder.name} options`}
            className='fixed z-50 min-w-32 rounded-xl border border-border/70 bg-background p-1 shadow-lg'
            style={{
              left: contextMenu.left,
              top: contextMenu.top,
            }}>
            <button
              type='button'
              onClick={handleStartRename}
              role='menuitem'
              className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted'>
              <Icon
                name='open-folder'
                className='size-4 text-muted-foreground'
              />
              <span>Edit</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
