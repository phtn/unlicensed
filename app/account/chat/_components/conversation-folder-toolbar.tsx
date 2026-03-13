'use client'

import {Id} from '@/convex/_generated/dataModel'
import type {ConversationFolderSummary} from '@/convex/messages/d'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {MouseEvent, SubmitEvent, useEffect, useRef, useState} from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedFolder =
    folders.find((folder) => String(folder._id) === activeFolderId) ?? null
  const isEditingSelectedFolder =
    !!editingFolder &&
    !!selectedFolder &&
    editingFolder._id === selectedFolder._id

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

  useEffect(() => {
    if (!isFormVisible) return

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isFormVisible, editingFolder?._id])

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

  const handleToggleSelectedFolderEdit = () => {
    if (!selectedFolder) {
      return
    }

    if (isEditingSelectedFolder && isFormVisible) {
      handleCancelEdit()
      return
    }

    setEditingFolder(selectedFolder)
    setDraft(selectedFolder.name)
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
    // {
    //   id: UNFILED_CONVERSATIONS_FOLDER,
    //   label: 'Unsorted',
    //   count: counts.unfiled,
    // },
  ]

  return (
    <div className='relative border-b border-sidebar bg-background/95 pt-2 px-0 md:py-3 supports-backdrop-filter:backdrop-blur-md pe-1'>
      <div className='flex items-center gap-x-2'>
        <div className='flex-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 bg-linear-to-r from-dark-table dark:from-sidebar via-brand/50 to-brand/10'>
          <div className='flex items-center h-8 w-max gap-2'>
            {folderChips.map((folder) => {
              const isActive = activeFolderId === folder.id
              return (
                <button
                  key={folder.id}
                  type='button'
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md border md:ps-1.5 ps-2 h-6 text-xs font-ios font-medium',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 bg-background/70 text-muted-foreground hover:text-foreground',
                  )}>
                  <span className='select-none'>{folder.label}</span>
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-sm aspect-square h-5 w-auto text-[10px]',
                      isActive
                        ? 'bg-background/15 text-inherit'
                        : 'bg-sidebar text-foreground/70',
                    )}>
                    {folder.count}
                  </div>
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
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md border ps-2 md:ps-1.5 md:py-1.5 h-6 text-xs font-ios font-medium aspect-square',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 bg-background/70 text-muted-foreground hover:text-foreground hover:border-foreground/40',
                  )}>
                  <span>{folder.name}</span>
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-sm aspect-square h-5 w-auto text-[10px]',
                      isActive
                        ? 'bg-background/15 text-inherit'
                        : 'bg-sidebar text-foreground/70',
                    )}>
                    {counts.byFolderId[folderId] ?? 0}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2 md:gap-1'>
          <button
            type='button'
            onClick={handleToggleSelectedFolderEdit}
            aria-label={
              isEditingSelectedFolder && isFormVisible
                ? 'Cancel folder rename'
                : 'Rename selected folder'
            }
            disabled={!selectedFolder}
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-background/80 text-muted-foreground',
              selectedFolder
                ? 'hover:border-sidebar hover:text-foreground'
                : 'cursor-not-allowed opacity-40',
              isEditingSelectedFolder && 'border-sidebar text-foreground',
              {hidden: isFormVisible},
            )}>
            <Icon name='pencil-fill' className='size-4' />
          </button>

          <button
            type='button'
            onClick={
              isFormVisible && editingFolder
                ? handleCancelEdit
                : handleToggleForm
            }
            aria-label={isFormVisible ? 'Hide folder form' : 'Show folder form'}
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-background/80 text-muted-foreground hover:border-sidebar hover:text-foreground',
              isFormVisible &&
                !editingFolder &&
                'border-sidebar text-foreground',
              {'bg-red-400/10 dark:bg-red-400/20': isFormVisible},
            )}>
            <Icon
              name='plus'
              className={cn('size-4 transition-transform duration-200', {
                'rotate-[112.5deg] size-5 dark:text-red-300': isFormVisible,
              })}
            />
          </button>
        </div>
      </div>

      {isFormVisible && (
        <form
          onSubmit={handleSubmit}
          className='left-0 bg-background mt-3 flex items-center w-full absolute ps-2 pe-1 pb-3 gap-2 border-b border-sidebar'>
          <div className='relative order-1 flex w-full items-center space-x-2 sm:order-0'>
            <Icon
              name='open-folder'
              className='pointer-events-none size-4 text-muted-foreground'
            />
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={editingFolder ? 'Rename folder' : 'New folder'}
              className='h-8 w-full rounded-sm bg-sidebar pl-2 pr-3 text-sm outline-none placeholder:text-muted-foreground'
              maxLength={40}
            />
          </div>
          <button
            type='submit'
            disabled={!draft.trim()}
            className={cn(
              'order-2 inline-flex h-6 w-6 aspect-square flex-1 items-center justify-center rounded-sm disabled:cursor-not-allowed disabled:opacity-50 sm:order-0 sm:flex-none bg-emerald-500/10',
              {'dark:text-emerald-400': true},
            )}>
            <Icon name='check' className='size-4' />
          </button>
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
