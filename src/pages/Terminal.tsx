import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect, useNetwork } from 'wagmi'
import { useState } from 'react'

export default function Terminal() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const { chain } = useNetwork()
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
          <h1 className="text-white text-3xl font-mono mb-8 tracking-wider">NOKTEK TERMINAL</h1>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-mono p-4">
      <header className="flex justify-between items-center mb-8 border-b border-[#1F1F1F] pb-4">
        <h1 className="text-xl tracking-wider">NOKTEK TERMINAL</h1>
        <button onClick={() => disconnect()} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition">
          Disconnect
        </button>
      </header>

      <main className="max-w-2xl mx-auto space-y-4">
        <div className="border border-[#1F1F1F] rounded p-4">
          <div className="text-gray-400 text-sm mb-2">Wallet Address</div>
          <div className="flex justify-between items-center">
            <span className="text-lg">{address?.slice(0,6)}...{address?.slice(-4)}</span>
            <button onClick={copyAddress} className="bg-[#1F1F1F] hover:bg-[#2A2A2A] px-3 py-1 rounded text-sm">
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
      </main>

      <div className="text-center text-gray-500 text-sm mt-8">
        Network: {chain?.name || 'Ethereum'}
      </div>
    </div>
  )
}
