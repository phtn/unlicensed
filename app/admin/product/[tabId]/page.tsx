import {Content} from './content'
interface Props {
  params: Promise<{
    tabId: string
  }>
}
const Page = async ({params}: Props) => {
  const tabId = (await params).tabId

  return <Content tabId={tabId} />
}
export default Page
