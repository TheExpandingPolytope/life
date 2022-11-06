import { useWeb3React } from "@web3-react/core"
import { useEffect, useState } from "react"

export function useBlockNumber() {
    const { provider } = useWeb3React()
    const [block, setBlock] = useState()
    useEffect(() => {
        const getBlock = async () => {
            try {
                let newBlock = await provider.getBlockNumber()
                setBlock(newBlock)
                console.log(newBlock)
                await delay(1000)
                await getBlock()
            }
            catch {
                
            }         
        }

        getBlock()
            .catch(console.error)
    }, [provider])
    return block
}