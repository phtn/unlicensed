import {Content} from './content'
interface PageProps {
  params: Promise<{
    tabId: string
  }>
}
const Page = async ({params}: PageProps) => {
  const tabId = (await params).tabId
  return <Content tabId={tabId} />
}
export default Page

