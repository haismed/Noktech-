import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { Link } from 'react-router-dom';

export default function Terminal() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="border border-[#1F1F1F] bg-[#0A0A0A] p-8 max-w-md w-full space-y-6">
        <h1 className="text-xl font-bold uppercase tracking-tighter">NOKTEK TERMINAL</h1>
        
        {!isConnected ? (
          <div className='space-y-4'>
            <p className="text-sm text-gray-400">Connect your wallet to access the economy</p>
            <ConnectButton label="Connect Wallet" chainStatus="none" accountStatus="avatar" />
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='bg-[#1F1F1F] p-4 text-xs'>
                <p>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p>ETH Balance: {balance?.formatted} {balance?.symbol}</p>
                <p>NOK Balance: 0.00</p>
            </div>
            <ConnectButton accountStatus="address" />
          </div>
        )}
        
        <Link to="/" className='block text-xs text-gray-500 hover:text-white underline'>Back to Home</Link>
      </div>
    </div>
  );
}
