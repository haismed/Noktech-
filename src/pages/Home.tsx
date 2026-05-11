import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center font-mono">
      <div className="border border-[#1F1F1F] bg-[#0A0A0A] p-12 max-w-sm w-full text-center space-y-8">
        <div className="w-16 h-16 bg-[#2563EB] mx-auto flex items-center justify-center font-black text-2xl">NT</div>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tighter">NokTek Economy</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Attention Monetization & Liquidity Gateway</p>
        </div>
        <Link to="/terminal" className="block w-full py-3 border border-[#2563EB] text-[#2563EB] font-bold uppercase tracking-widest text-xs hover:bg-[#2563EB] hover:text-white transition-all">Enter Terminal</Link>
      </div>
    </div>
  );
}
