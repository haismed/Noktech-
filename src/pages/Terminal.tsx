import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState } from 'react'

// Faucet contract ABI - only the claim function
const faucetAbi = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Sepolia Testnet Faucet - للتجربة فقط
// هذا عقد عام على Sepolia تقدر تستدعي claim() منه
const FAUCET_ADDRESS = '0xFf36E3e7F8E52C0A5eF25b4f6b3b2A21a4B12c08' 

export default function Terminal() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  
  // Contract write hook
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Copy wallet address
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Call claim function on the contract
  const handleClaim = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: faucetAbi,
      functionName: 'claim',
    })
  }

  // UI before wallet connection
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

  // UI after connection
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
            <button 
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded text-sm transition"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Claiming...' : isSuccess ? 'Claimed!' : 'Claim Testnet NOK'}
            </button>
          </div>
          {hash && (
            <div className="text-xs text-gray-500 mt-2">
              Tx: {hash.slice(0,10)}...{hash.slice(-8)}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 mt-2">
              Error: {error.shortMessage || 'Transaction failed'}
            </div>
          )}
        </div>
      </main>

      <div className="text-center text-gray-500 text-sm mt-8">
        Network: {chain?.name || 'Ethereum'}
      </div>
    </div>
  )
}
