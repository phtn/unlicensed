import {Card, CardBody, CardFooter, Image} from '@heroui/react'

export const CategoryList = () => {
  const category = [
    {
      title: 'Flower',
      img: 'https://www.heroui.com/images/fruit-1.jpeg',
      price: '$5.50',
    },
    {
      title: 'Edibles',
      img: 'https://www.heroui.com/images/fruit-2.jpeg',
      price: '$3.00',
    },
    {
      title: 'Concentrates',
      img: 'https://www.heroui.com/images/fruit-3.jpeg',
      price: '$10.00',
    },
    {
      title: 'Pre-rolls',
      img: 'https://www.heroui.com/images/fruit-4.jpeg',
      price: '$5.30',
    },
    {
      title: 'Beverages',
      img: 'https://www.heroui.com/images/fruit-5.jpeg',
      price: '$15.70',
    },
    {
      title: 'Vapes',
      img: 'https://www.heroui.com/images/fruit-6.jpeg',
      price: '$8.00',
    },
  ]

  return (
    <div className='gap-4 grid grid-cols-2 sm:grid-cols-6'>
      {category.map((item, index) => (
        <Card
          key={index}
          radius='sm'
          className='border-none'
          isPressable
          shadow='sm'
          onPress={() => console.log('item pressed')}>
          <CardBody className='overflow-visible p-0'>
            <Image
              alt={item.title}
              radius='none'
              className='w-full object-cover h-28'
              src={item.img}
              shadow='sm'
              width='100%'
            />
          </CardBody>
          <CardFooter className='text-xl h-10 font-space font-bold justify-between'>
            <p>{item.title}</p>
            {/*<p className='text-default-500'>{item.price}</p>*/}
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
    price: '$5.50',
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
