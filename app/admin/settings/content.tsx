'use client'

import {MainWrapper} from '../_components/main-wrapper'
import {SettingsTabs} from './tabs'

export const Content = () => {
  return (
    <MainWrapper className='md:p-4'>
      <SettingsTabs />
    </MainWrapper>
  )
}
