import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/useGameStore'

// Backward-compatible wrapper. useShallow prevents infinite re-render loops
// when the selector returns a new object shape each call.
export function useCollection() {
  return useGameStore(
    useShallow(s => ({
      collected: s.collected,
      completedGoals: s.completedGoals,
      categoriesCollected: s.categoriesCollected,
      collect: s.collect,
      uncollect: s.uncollect,
      isCollected: s.isCollected,
    })),
  )
}
