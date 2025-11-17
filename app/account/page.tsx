'use client'

import {TextureCardStyled} from '@/components/ui/texture-card'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {Image} from '@heroui/react'
import {useQuery} from 'convex/react'

export default function AccountPage() {
  const {user: firebaseUser} = useAuth()
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {firebaseId: firebaseUser.uid} : 'skip',
  )

  // For demo purposes, using sample data structure
  // In production, you'd extend the user schema to include these fields
  const profileData = {
    name: convexUser?.name || firebaseUser?.displayName || 'Maria Fernanda',
    email: convexUser?.email || firebaseUser?.email || '',
    photoUrl:
      convexUser?.photoUrl ||
      firebaseUser?.photoURL ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    isPremium: true,
    role: 'Beatmaker',
    experienceLevel: 'Intermediate',
    favoriteArtists: ['Ninho', 'Travis Scott', 'Metro Boomin'],
    favoriteGenre: 'Trap',
    software: 'Ableton',
    musicMood: 'Melancholic',
    location: 'California, USA',
    availability: 'Available for Collaboration',
    badges: ['Top Collaborator'],
    tags: ['#Drill', '#Melancholic', '#Rap-US'],
    socialMedia: {
      youtube: 'https://youtube.com',
      instagram: convexUser?.socialMedia?.instagram || 'https://instagram.com',
      tiktok: convexUser?.socialMedia?.tiktok || 'https://tiktok.com',
    },
  }

  return (
    <div className='min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-base font-space space-x-3'>
            <span className='opacity-70 font-light'>Profile</span>
            <span className='font-medium'></span>
          </h1>
        </div>

        {/* Main Content */}
        <TextureCardStyled>
          <div className='h-140 grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-16'>
            {/* Left Column */}
            <div className='flex flex-col items-center justify-center'>
              {/* User Name and Premium Status */}
              <div>
                <h2 className='text-base sm:text-xl font-semibold text-foreground mb-3'>
                  {profileData.name}
                </h2>
              </div>

              {/* Profile Picture - Large and Prominent */}
              <div className='relative w-fit aspect-square max-w-[200px] rounded-full overflow-hidden bg-foreground/10 border-4 border-foreground/20'>
                {profileData.photoUrl ? (
                  <Image
                    src={profileData.photoUrl}
                    alt={profileData.name}
                    className='w-full h-full object-cover'
                    radius='full'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-6xl text-foreground/50'>
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            {/*<ProfileInfo />*/}
          </div>
        </TextureCardStyled>
      </div>
    </div>
  )
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <div className='flex flex-col sm:flex-row gap-2'>
      <span className='text-sm text-foreground/60 font-normal min-w-[240px] sm:min-w-[280px]'>
        {label}:
      </span>
      <span className='text-sm text-foreground font-normal'>{value}</span>
    </div>
  )
}
