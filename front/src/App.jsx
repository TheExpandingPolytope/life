import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Game } from './Game'
import Auth from './Auth'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Real Game of Life</h1>
      <Auth/>
      <Game/>
    </div>
  )
}

export default App
