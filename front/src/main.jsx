import { Web3ReactProvider } from '@web3-react/core'
import { metaMask, hooks as metaMaskHooks  } from './connectors/metamask';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const connectors = [
  [metaMask, metaMaskHooks],
]

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3ReactProvider connectors={connectors}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Web3ReactProvider>
)
