import {Content} from './content'

interface Props {
  params: Promise<{
    config: string
    tabId: string
  }>
}

const Page = async ({params}: Props) => {
  const {config, tabId} = await params

  return <Content config={config} tabId={tabId} />
}

export default Page
