/* Extracted from GatePanel.tsx - ResultView */
import { useGameStore } from '../../store';
import { cn } from '../../utils';

export default function ResultView({ onReturn }: { onReturn: () => void }) {
    const { ruinsRun, endRun } = useGameStore();
    const isWin = ruinsRun?.status === 'completed';

    return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500 relative py-8">
             <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] sm:w-[30rem] sm:h-[30rem] blur-[100px] sm:blur-[120px] rounded-full pointer-events-none opacity-15 sm:opacity-20", isWin ? "bg-cyan-500/50" : "bg-red-500/50")}></div>
             
             <div className={cn("w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 flex items-center justify-center shadow-2xl shrink-0 relative z-10 bg-black/40", isWin ? "border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]" : "border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]")}>
                  <div className="text-3xl lg:text-4xl font-serif">{isWin ? "胜" : "败"}</div>
             </div>
             
             <div className="text-center relative z-10">
                 <h2 className="text-3xl lg:text-4xl font-serif tracking-widest text-slate-100 mb-4">
                     {isWin ? "肃清遗迹" : "折戟沉沙"}
                 </h2>
                 <p className="text-slate-400 max-w-sm mx-auto">
                     {isWin ? "三层妖氛尽扫，满载宝物而归。将士们稍作修整，可再战沙场。" : "实力不济，只得暂避锋芒。望大人回署中精进武备，来日方长。"}
                 </p>
             </div>
             
             <button 
                 onClick={() => {
                     endRun();
                     onReturn();
                 }}
                 className={cn("relative z-10 w-full px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-bold tracking-widest uppercase transition-all shadow-xl text-sm", isWin ? "bg-cyan-500/10 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]" : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10")}
             >
                 返回营地
             </button>
         </div>
    );
}
