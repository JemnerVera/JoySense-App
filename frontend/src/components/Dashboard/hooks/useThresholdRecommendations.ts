import { useState } from 'react'

interface UseThresholdRecommendationsReturn {
  // Estados
  showThresholdModal: boolean
  thresholdRecommendations: any | null
  showDetailedThresholdData: boolean
  
  // Setters
  setShowThresholdModal: (s: boolean) => void
  setThresholdRecommendations: (r: any) => void
  setShowDetailedThresholdData: (s: boolean) => void
}

export function useThresholdRecommendations(): UseThresholdRecommendationsReturn {
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [thresholdRecommendations, setThresholdRecommendations] = useState<any>(null)
  const [showDetailedThresholdData, setShowDetailedThresholdData] = useState(false)

  return {
    showThresholdModal,
    thresholdRecommendations,
    showDetailedThresholdData,
    setShowThresholdModal,
    setThresholdRecommendations,
    setShowDetailedThresholdData
  }
}
