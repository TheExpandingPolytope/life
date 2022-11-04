import { useWeb3React } from "@web3-react/core"
import { useEffect } from "react"
import { hooks, metaMask } from './connectors/metamask'

const { useChainId, useAccounts, useError, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

export default () => {
    const { isActive, account, provider} = useWeb3React()
    //const provider = useProvider()

    // attempt to connect eagerly on mount
    useEffect(() => {
        void metaMask.connectEagerly()
    }, [])


    return (
        <div>
            {isActive ? 
                <button className="button">{account}</button> :
                <button 
                    className="button"
                    onClick={()=> metaMask.activate()}
                >
                    Connect to a wallet
                </button>
            } 
        </div>
        
    )
}