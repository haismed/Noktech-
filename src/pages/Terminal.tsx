import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId, useChains } from 'wagmi';
import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';

export default function Terminal() {
  const { address, isConnected, chainId } = useAccount();
  const { data: balance } = useBalance({ address });
  const chains = useChains();
  const currentChain = chains.find((c) => c.id === chainId);

  const copyToClipboard = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 font-mono">
      {!isConnected ? (
        <div className="border border-[#1F1F1F] bg-[#0A0A0A] p-8 max-w-sm w-full space-y-6 text-center">
            <h1 className="text-xl font-bold uppercase tracking-tighter">NOKTEK TERMINAL</h1>
            <p className="text-sm text-gray-400">Connect your wallet to access the economy</p>
            <div className="flex justify-center">
                <ConnectButton label="Connect Wallet" chainStatus="none" accountStatus="avatar" />
            </div>
            <Link to="/" className='block text-xs text-gray-500 hover:text-white underline'>Back to Home</Link>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#0A0A0A] p-4 border border-[#1F1F1F] rounded-sm">
            <h1 className="text-xl font-bold uppercase tracking-tighter">NOKTEK TERMINAL</h1>
            <ConnectButton showBalance={false} />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wallet Card */}
            <div className="border border-[#1F1F1F] p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase">Wallet</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm truncate">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    <button onClick={copyToClipboard} className="text-gray-400 hover:text-white"><Copy size={14} /></button>
                </div>
            </div>
            
            {/* ETH Balance Card */}
            <div className="border border-[#1F1F1F] p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase">ETH Balance</p>
                <p className="text-sm">{balance?.formatted} {balance?.symbol}</p>
            </div>

            {/* NOK Balance Card */}
            <div className="border border-[#1F1F1F] p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase">NOK Balance</p>
                <p className="text-sm">0.00 NOK</p>
                <button disabled className="w-full py-1 text-[10px] bg-[#2563EB] text-white uppercase disabled:opacity-50">Claim Testnet NOK</button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500 bg-[#0A0A0A] p-4 border border-[#1F1F1F] rounded-sm flex justify-between">
            <span>Network: {currentChain?.name || 'Unknown'}</span>
            <Link to="/" className='hover:text-white underline'>Back to Home</Link>
          </div>
        </div>
      )}
    </div>
  );
}
