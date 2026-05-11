import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect, useChainId, useChains } from 'wagmi'
import { useState } from 'react'

export default function Terminal() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const chains = useChains()
  const chain = chains.find((c) => c.id === chainId)
  const { data: balance } = useBalance({ address })
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-mono mb-8">NOKTEK TERMINAL</h1>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-mono p-4">
      <header className="flex justify-between items-center mb-8 border-b border-[#1F1F1F] pb-4">
        <h1 className="text-xl">NOKTEK TERMINAL</h1>
        <button onClick={() => disconnect()} className="bg-red-600 px-4 py-2 rounded text-sm">
          Disconnect
        </button>
      </header>

      <div className="grid gap-4 max-w-2xl mx-auto">
        <div className="border border-[#1F1F1F] rounded p-4">
          <div className="text-gray-400 text-sm mb-2">Wallet</div>
          <div className="flex justify-between items-center">
            <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button onClick={copyAddress} className="bg-[#1F1F1F] px-3 py-1 rounded text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="border border-[#1F1F1F] rounded p-4">
          <div className="text-gray-400 text-sm mb-2">ETH Balance</div>
          <div className="text-2xl">{balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} ETH</div>
        </div>

        <div className="border border-[#1F1F1F] rounded p-4">
          <div className="text-gray-400 text-sm mb-2">NOK Balance</div>
          <div className="flex justify-between items-center">
            <span className="text-2xl">0.00 NOK</span>
            <button disabled className="bg-[#2563EB] opacity-50 px-4 py-2 rounded text-sm cursor-not-allowed">
              Claim Testnet NOK
            </button>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-4">
          Network: {chain?.name || 'Mainnet'}
        </div>
      </div>
    </div>
  )
}
