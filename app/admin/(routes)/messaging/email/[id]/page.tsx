import {Content} from './content'

interface Props {
  params: Promise<{
    id: string
  }>
}

const Page = async ({params}: Props) => {
  const {id} = await params

  return <Content tabId={id} />
}

export default Page
