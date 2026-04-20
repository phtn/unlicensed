import type {Attribute} from 'next-themes'
import {createHyfeStorageKey} from './storage-keys'

export const THEME_ATTRIBUTE: Attribute = 'class'
export const THEME_DEFAULT_THEME = 'dark'
export const THEME_ENABLE_COLOR_SCHEME = true
export const THEME_ENABLE_SYSTEM = true
export const THEME_STORAGE_KEY = createHyfeStorageKey('theme')
export const THEME_LEGACY_STORAGE_KEYS = ['theme'] as const
export const THEME_THEMES = ['light', 'dark'] as const

type ThemeValueMap = Record<string, string>

export interface ThemeScriptConfig {
  attribute: Attribute | Attribute[]
  defaultTheme: string
  enableColorScheme: boolean
  enableSystem: boolean
  legacyStorageKeys?: readonly string[]
  storageKey: string
  themes: readonly string[]
  value?: ThemeValueMap
}

export const themeScriptConfig: ThemeScriptConfig = {
  attribute: THEME_ATTRIBUTE,
  defaultTheme: THEME_DEFAULT_THEME,
  enableColorScheme: THEME_ENABLE_COLOR_SCHEME,
  enableSystem: THEME_ENABLE_SYSTEM,
  legacyStorageKeys: THEME_LEGACY_STORAGE_KEYS,
  storageKey: THEME_STORAGE_KEY,
  themes: THEME_THEMES,
}

export function createThemeInitScript(config: ThemeScriptConfig) {
  const serializedConfig = JSON.stringify({
    ...config,
    themes: [...config.themes],
  })

  return `(function(){try{var config=${serializedConfig};var root=document.documentElement;var storedTheme=null;try{storedTheme=localStorage.getItem(config.storageKey);if(storedTheme==null&&Array.isArray(config.legacyStorageKeys)){for(var legacyIndex=0;legacyIndex<config.legacyStorageKeys.length;legacyIndex+=1){var legacyKey=config.legacyStorageKeys[legacyIndex];storedTheme=localStorage.getItem(legacyKey);if(storedTheme!=null)break}}}catch(storageError){}var theme=storedTheme||config.defaultTheme;var resolvedTheme=theme;if(theme==="system"&&config.enableSystem){resolvedTheme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var attributes=Array.isArray(config.attribute)?config.attribute:[config.attribute];var mappedThemes=config.value?config.themes.map(function(themeName){return config.value[themeName]||themeName}):config.themes.slice();var resolvedValue=config.value&&config.value[resolvedTheme]?config.value[resolvedTheme]:resolvedTheme;for(var index=0;index<attributes.length;index+=1){var attribute=attributes[index];if(attribute==="class"){if(mappedThemes.length){root.classList.remove.apply(root.classList,mappedThemes)}if(resolvedValue){root.classList.add(resolvedValue)}}else if(resolvedValue){root.setAttribute(attribute,resolvedValue)}else{root.removeAttribute(attribute)}}if(config.enableColorScheme&&(resolvedTheme==="light"||resolvedTheme==="dark")){root.style.colorScheme=resolvedTheme}}catch(error){}})();`
}
