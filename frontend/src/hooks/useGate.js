import { useState, useEffect, useMemo } from 'react'
import { getGates } from '../api/campus'
import { useRole } from './useRole'

// Admin / chief pick from every active gate; a guard is limited to their posts.
export function useGate() {
  const { seesAllGates, assignedGates } = useRole()
  const [allGates, setAllGates] = useState([])
  const [gateId, setGateId] = useState(null)

  const gateChoices = useMemo(
    () => (seesAllGates ? allGates : assignedGates),
    [seesAllGates, allGates, assignedGates],
  )

  useEffect(() => {
    if (seesAllGates) getGates({ is_active: true }).then(({ data }) => setAllGates(data))
  }, [seesAllGates])

  useEffect(() => {
    if (!gateId && gateChoices.length) setGateId(gateChoices[0].id)
  }, [gateChoices, gateId])

  return {
    gateChoices,
    gateId,
    setGateId,
    currentGate: gateChoices.find((g) => g.id === gateId),
    noGate: gateChoices.length === 0,
  }
}
