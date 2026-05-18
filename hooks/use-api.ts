import {useToggle} from './use-toggle'

export const useApi = () => {
  const {on: loading, toggle} = useToggle(false)

  const handleApiCall = async (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  ) => {
    toggle()
    try {
      const response = await fetch(url, {method})
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      toggle()
    }
  }

  return {handleApiCall, loading}
}
