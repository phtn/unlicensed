import {api} from '@/convex/_generated/api'
import {Card, CardBody, CardFooter, Image, Link} from '@heroui/react'
import {useQuery} from 'convex/react'

export const CategoryList = () => {
  const cat = useQuery(api.categories.q.listCategories)

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
              src={item.heroImage}
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

export const fruits = [
  {
    title: 'Orange',
    img: 'https://www.heroui.com/images/fruit-1.jpeg',
    href: '$5.50',
  },
  {
    title: 'Tangerine',
    img: 'https://www.heroui.com/images/fruit-2.jpeg',
    price: '$3.00',
  },
  {
    title: 'Raspberry',
    img: 'https://www.heroui.com/images/fruit-3.jpeg',
    price: '$10.00',
  },
  {
    title: 'Lemon',
    img: 'https://www.heroui.com/images/fruit-4.jpeg',
    price: '$5.30',
  },
  {
    title: 'Avocado',
    img: 'https://www.heroui.com/images/fruit-5.jpeg',
    price: '$15.70',
  },
  {
    title: 'Lemon 2',
    img: 'https://www.heroui.com/images/fruit-6.jpeg',
    price: '$8.00',
  },
  {
    title: 'Banana',
    img: 'https://www.heroui.com/images/fruit-7.jpeg',
    price: '$7.50',
  },
  {
    title: 'Watermelon',
    img: 'https://www.heroui.com/images/fruit-8.jpeg',
    price: '$12.20',
  },
]
