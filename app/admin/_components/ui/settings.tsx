'use client'

import {ScrollArea} from '@/components/ui/scroll-area'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {Button, Drawer, DrawerContent, DrawerHeader} from '@heroui/react'
import {usePathname} from 'next/navigation'
import {
  type ComponentProps,
  createContext,
  CSSProperties,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {useOrderDetailsSafe} from '../../(routes)/ops/orders/order-details-context'
import {OrderDetailsForm} from '../../(routes)/ops/orders/order-details-form'
import {useProductDetailsSafe} from '../product-details-context'
import {ProductDetailsForm} from '../product-details-form'
// import { MODELS as CHAT_MODELS, useChatSettings } from "@/ctx/chat/store";
// import { useVoiceSettings } from "@/ctx/voice/store";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useConversations } from "@/ctx/chat/conversations";

type Collapsible = 'none' | 'icon' | 'content'

interface SettingsPanelProviderProps extends ComponentProps<'div'> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type SettingsPanelContext = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  togglePanel: VoidFunction
  collapsible?: Collapsible
}

const SETTINGS_COOKIE_NAME = 'settings:state'
const SETTINGS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SETTINGS_WIDTH = '400px'
const SETTINGS_WIDTH_MOBILE = '18rem'
const SETTINGS_WIDTH_ICON = '0rem'
const SETTINGS_KEYBOARD_SHORTCUT = 'p'

const SettingsPanelContext = createContext<SettingsPanelContext | null>(null)

function useSettingsPanel() {
  const context = useContext(SettingsPanelContext)
  if (!context) {
    throw new Error(
      'useSettingsPanel must be used within a SettingsPanelProvider.',
    )
  }
  return context
}

// Safe hook that returns null if context is not available
function useSettingsPanelSafe() {
  const context = useContext(SettingsPanelContext)
  return context || null
}

const SettingsPanelProvider = ({
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange: setOpenProp,
  style,
  className,
  ...props
}: SettingsPanelProviderProps) => {
  const isMobile = useMobile()
  const [openMobile, setOpenMobile] = useState(false)

  const [_open, _setOpen] = useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${SETTINGS_COOKIE_NAME}=${openState}; path=/; max-age=${SETTINGS_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open],
  )

  const togglePanel = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SETTINGS_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        togglePanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = useMemo<SettingsPanelContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      togglePanel,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, togglePanel],
  )

  return (
    <SettingsPanelContext.Provider value={contextValue}>
      <div
        style={
          {
            '--settings-width': SETTINGS_WIDTH,
            '--settings-width-icon': SETTINGS_WIDTH_ICON,
            ...style,
          } as CSSProperties
        }
        className={cn('group/settings-wrapper flex w-full', className)}
        {...props}>
        {children}
      </div>
    </SettingsPanelContext.Provider>
  )
}
SettingsPanelProvider.displayName = 'SettingsPanelProvider'

interface SettingsPanelProps extends ComponentProps<'div'> {
  side?: 'left' | 'right'
}

const SettingsPanel = ({
  className,
  children,
  side = 'right',
  ...props
}: SettingsPanelProps) => {
  const {isMobile, openMobile, setOpenMobile, collapsible, state} =
    useSettingsPanel()

  if (collapsible === 'none') {
    return (
      <div
        className={cn(
          'flex h-full w-(--settings-width) flex-col bg-fade text-sidebar-foreground',
          className,
        )}
        {...props}>
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Drawer defaultChecked={openMobile} onOpenChange={setOpenMobile}>
        <DrawerContent
          className={cn('w-72 px-4 py-0 bg-fade [&>button]:hidden', {})}
          style={
            {
              '--settings-width': SETTINGS_WIDTH_MOBILE,
            } as CSSProperties
          }>
          <DrawerHeader className='hidden'>Settings</DrawerHeader>
          <div className='flex h-full w-full flex-col'>
            <SettingsPanelContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <ScrollArea className='scrollbar-hide h-fit'>
      <div
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-side={side}
        className={cn(
          'bg-linear-to-r from-transparent from-10% via-sidebar to-sidebar group peer relative hidden md:block text-sidebar-foreground transition-[width] duration-200 ease-in-out',
          'border-b-4 border-teal-300',
          state === 'expanded' ? 'w-(--settings-width)' : 'w-0',
        )}>
        <div
          className={cn(
            'ml-4 relative h-svh overflow-hidden bg-transparent transition-transform duration-400 ease-in-out',
            'w-(--settings-width) px-2 md:pr-4',
            state === 'collapsed' &&
              (side === 'right' ? 'translate-x-full' : '-translate-x-full'),
          )}>
          <SettingsPanelContent />
        </div>
      </div>
    </ScrollArea>
  )
}
SettingsPanel.displayName = 'SettingsPanel'

const SettingsPanelContent = () => {
  // Use order details context if available (for orders page)
  const orderDetailsContext = useOrderDetailsSafe()
  const route = usePathname().split('/').pop()

  // Use product details context if available (for inventory page)
  const productDetailsContext = useProductDetailsSafe()

  const selectedEntity = useMemo(() => {
    const selectedOrder = orderDetailsContext?.selectedOrder ?? null
    const selectedProduct = productDetailsContext?.selectedProduct ?? null
    switch (route) {
      case 'orders':
        return {
          title: 'Order Details',
          subtext:
            selectedOrder && selectedOrder.updatedAt
              ? formatDate(selectedOrder.updatedAt)
              : '',
          form: selectedOrder ? (
            <OrderDetailsForm order={selectedOrder} />
          ) : null,
        }
      case 'inventory':
        return {
          title: selectedProduct?.name,
          subtext: selectedProduct?.categorySlug,
          form: selectedProduct ? (
            <ProductDetailsForm product={selectedProduct} />
          ) : null,
        }
      default:
        return {
          title: 'Settings',
          data: null,
        }
    }
  }, [route, orderDetailsContext, productDetailsContext])

  return (
    <Panel title={selectedEntity.title} subtext={selectedEntity.subtext}>
      {selectedEntity.form}
    </Panel>
  )
}
SettingsPanelContent.displayName = 'SettingsPanelContent'

interface PanelProps {
  title?: string
  subtext?: string
  children?: ReactNode
}

const Panel = ({title, subtext, children}: PanelProps) => {
  return (
    <div className='h-full flex flex-col pt-0'>
      <div
        className={cn('h-14 flex items-center justify-between relative mb-2')}
        style={
          {
            '--settings-width': SETTINGS_WIDTH,
            '--settings-width-icon': SETTINGS_WIDTH_ICON,
          } as CSSProperties
        }>
        <PanelHeader title={title} subtext={subtext} />
      </div>
      <div className='px-0'>{children}</div>
    </div>
  )
}

interface PanelHeaderProps {
  title?: string
  subtext?: string
}

const PanelHeader = ({title, subtext}: PanelHeaderProps) => {
  return (
    <div className='w-full h-10 flex items-center justify-between'>
      <input
        className='text-xl font-medium w-full tracking-tighter bg-transparent border-none shadow-none outline-none focus-within:ring-0 focus-visible:ring-0'
        defaultValue={title}
      />
      {subtext && (
        <span className='flex-1 font-space text-sm opacity-70 whitespace-nowrap'>
          {subtext}
        </span>
      )}
    </div>
  )
}

const SettingsPanelTrigger = () => {
  const {isMobile, state, togglePanel} = useSettingsPanel()

  const isExpanded = useMemo(() => state === 'expanded', [state])

  if (!isMobile) {
    return null
  }

  return (
    <Button
      variant='ghost'
      data-sidebar='trigger'
      className={cn('text-foreground/80 hover:text-foreground')}
      onPress={togglePanel}>
      <Icon name='sidebar' className={cn('h-4', isExpanded && 'rotate-180')} />
      <span className='sr-only'>Toggle Sidebar</span>
    </Button>
  )
}
SettingsPanelTrigger.displayName = 'SettingsPanelTrigger'

export {
  SettingsPanel,
  SettingsPanelProvider,
  SettingsPanelTrigger,
  useSettingsPanel,
  useSettingsPanelSafe,
}
