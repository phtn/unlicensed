'use client'

import {
  TextureCardContent,
  TextureCardFooter,
  TextureCardHeader,
  TextureCardStyled,
  TextureCardTitle,
  TextureSeparator,
} from '@/components/ui/texture-card'
import {Icon} from '@/lib/icons'
import {Button, Input} from '@heroui/react'

export const ProfileInfo = () => {
  return (
    <div className='flex items-center justify-center py-4'>
      <div className='h-full border rounded-md'>
        <div className=' items-start justify-center gap-6 rounded-lg p-2 md:p-8 grid grid-cols-1'>
          <div className='col-span-1 grid items-start gap-6 lg:col-span-1'>
            <div>
              <TextureCardStyled>
                <TextureCardHeader className='flex flex-col gap-1 items-center justify-center p-4'>
                  <div className='p-3 bg-neutral-950 rounded-full mb-3'></div>
                  <TextureCardTitle>Create your account</TextureCardTitle>
                </TextureCardHeader>
                <TextureSeparator />
                <TextureCardContent>
                  <form className='flex flex-col gap-6'>
                    <div className='flex justify-between gap-2'>
                      <div>
                        <Input
                          id='first'
                          type='first'
                          required
                          className='w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500'
                        />
                      </div>
                      <div>
                        <Input
                          id='last'
                          type='last'
                          required
                          className='w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500'
                        />
                      </div>
                    </div>

                    <div>
                      <Input
                        id='username'
                        type='username'
                        required
                        className='w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500'
                      />
                    </div>
                    <div>
                      <Input
                        id='email'
                        type='email'
                        required
                        className='w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500'
                      />
                    </div>
                    <div>
                      <Input
                        id='password'
                        type='password'
                        required
                        className='w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500'
                      />
                    </div>
                  </form>
                </TextureCardContent>
                <TextureSeparator />
                <TextureCardFooter className='border-b rounded-b-sm'>
                  <Button isIconOnly className='w-full'>
                    <div className='flex gap-1 items-center justify-center'>
                      Continue
                      <Icon
                        name='arrow-right'
                        className='h-4 w-4 text-neutral-50 mt-1px'
                      />
                    </div>
                  </Button>
                </TextureCardFooter>

                <div className='dark:bg-neutral-800 bg-stone-100 pt-px rounded-b-[20px] overflow-hidden '>
                  <div className='flex flex-col items-center justify-center'>
                    <div className='py-2 px-2'>
                      <div className='text-center text-sm'>
                        Already have an account?{' '}
                        <span className='text-primary'>Sign in</span>
                      </div>
                    </div>
                  </div>
                  <TextureSeparator />
                  <div className='flex flex-col items-center justify-center '>
                    <div className='py-2 px-2'>
                      <div className='text-center text-xs '>Secured by</div>
                    </div>
                  </div>
                </div>
              </TextureCardStyled>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
