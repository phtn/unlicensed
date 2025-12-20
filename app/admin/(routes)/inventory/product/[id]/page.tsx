import {EditProductContent} from './content'

interface Props {
  params: Promise<{
    id: string
  }>
}

const Page = async ({params}: Props) => {
  const {id} = await params

  return <EditProductContent id={id} />
}

export default Page

