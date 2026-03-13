import {createThemeInitScript, themeScriptConfig} from '@/lib/theme'

export function ThemeScript() {
  return (
    <script
      id='theme-init'
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: createThemeInitScript(themeScriptConfig),
      }}
    />
  )
}
