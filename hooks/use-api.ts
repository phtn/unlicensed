import {useState} from 'react'

export const useApi = () => {
  const [loading, setLoading] = useState(false)

  const handleApiCall = async (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  ) => {
    setLoading(true)
    try {
      const response = await fetch(url, {method})
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {handleApiCall, loading}
}
