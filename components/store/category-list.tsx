import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Card, CardBody, CardFooter, Image, Link} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

export const CategoryList = () => {
  const cat = useQuery(api.categories.q.listCategories)

  // Get all heroImage values for URL resolution
  const heroImages = useMemo(
    () => cat?.map((item) => item.heroImage) ?? [],
    [cat],
  )

  // Resolve storageIds to URLs
  const resolveUrl = useStorageUrls(heroImages)

  return (
    <div className='gap-8 grid grid-cols-2 sm:grid-cols-5'>
      {cat?.map((item, index) => (
        <Card
          as={Link}
          href={`/category/${item.name.toLowerCase()}`}
          key={index}
          radius='sm'
          className='border-none'
          isFooterBlurred
          isPressable
          shadow='sm'
          onPress={() => console.log('item pressed')}>
          <CardBody className='overflow-visible p-0'>
            <Image
              alt={item.name}
              radius='none'
              className='w-full object-cover'
              src={resolveUrl(item.heroImage)}
              shadow='sm'
              width='100%'
            />
          </CardBody>
          <CardFooter className='absolute bottom-0 text-xl h-10 font-fugaz font-light text-foreground/80 justify-between'>
            <p className='capitalize'>{item.name}</p>
            {/*<p className='text-default-500'>{item.href}</p>*/}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
