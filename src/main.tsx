import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useGameStore } from './store/useGameStore'
import { latLngToCell, gridDisk } from 'h3-js'
import { FOG_RES } from './engine/fogOfWar'

// Seed a ~250 m bubble around the starting Duomo position on first launch.
const s = useGameStore.getState()
if (s.exploredCells.length === 0) {
  const center = latLngToCell(s.pilgrimLat, s.pilgrimLng, FOG_RES)
  s.revealCells(gridDisk(center, 4))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
