import {Content} from './content'
type PageProps = {
  params: Promise<{slug: string}>
}
const Page = async ({params}: PageProps) => {
  const slug = (await params).slug
  return <Content slug={slug} />
}
export default Page
