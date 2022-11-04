import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Game } from './Game'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Real Game of Life</h1>
      <Game/>
    </div>
  )
}

export default App
