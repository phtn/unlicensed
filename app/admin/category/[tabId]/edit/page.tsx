import {EditCategoryContent} from './content'

interface Props {
  params: Promise<{
    tabId: string
  }>
}

const Page = async ({params}: Props) => {
  const {tabId} = await params

  return <EditCategoryContent categorySlug={tabId} />
}

export default Page
