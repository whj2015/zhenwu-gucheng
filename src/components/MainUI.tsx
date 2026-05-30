import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { Building, Hammer, Map, Users, Tent, HeartPulse, Store, Settings, Package, ScrollText } from 'lucide-react';
import { cn } from '../utils';
import CityPanel from './CityPanel';
import ForgePanel from './ForgePanel';
import HeroesPanel from './HeroesPanel';
import GatePanel from './GatePanel';
import BarracksPanel from './BarracksPanel';
import HospitalPanel from './HospitalPanel';
import MarketPanel from './MarketPanel';
import WarehousePanel from './WarehousePanel';
import UpdateLog from './UpdateLog';
import { getVersionDisplay } from '../version';

type Tab = 'city' | 'hospital' | 'market' | 'forge' | 'heroes' | 'gate' | 'barracks' | 'warehouse';

export default function MainUI() {
    const [activeTab, setActiveTab] = useState<Tab>('city');
    const { tick, claimOffline, lastTickTime } = useGameStore();
    const [offlineModal, setOfflineModal] = useState<{ amount: number } | null>(null);
    const [resetModal, setResetModal] = useState(false);
    const [updateLogModal, setUpdateLogModal] = useState(false);

    useEffect(() => {
        const now = Date.now();
        const deltaMs = now - lastTickTime;
        const offlineMins = Math.floor(deltaMs / 60000);
        if (offlineMins >= 10) {
            const capMins = Math.min(offlineMins, 12 * 60);
            const gains = capMins * 48;
            setOfflineModal({ amount: Math.floor(gains) });
            claimOffline(Math.floor(gains));
        }

        const interval = setInterval(() => {
            tick();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { id: 'city', label: '主城署', icon: Building },
        { id: 'hospital', label: '医馆', icon: HeartPulse },
        { id: 'market', label: '集市', icon: Store },
        { id: 'barracks', label: '募兵营', icon: Tent },
        { id: 'forge', label: '兵甲坊', icon: Hammer },
        { id: 'heroes', label: '门客', icon: Users },
        { id: 'warehouse', label: '库房', icon: Package },
        { id: 'gate', label: '城门', icon: Map },
    ] as const;

    return (
        <div className="flex w-full h-screen bg-[#0d0f12] text-slate-200 font-sans overflow-hidden relative select-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,transparent_70%)] opacity-40 pointer-events-none"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-900/10 blur-[120px] rounded-full pointer-events-none"></div>

             {/* Desktop Sidebar — hidden on mobile */}
             <aside className="hidden lg:flex w-64 bg-black/60 border-r border-white/5 flex-col shrink-0 relative z-10 backdrop-blur-md flex-col">
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                     <div className="w-10 h-10 bg-orange-600/20 border border-orange-500/50 flex items-center justify-center rounded-sm rotate-45 shrink-0">
                         <div className="-rotate-45 font-bold text-orange-500 text-xl font-serif">武</div>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold leading-tight">Zhenwu City</span>
                        <span className="text-base sm:text-lg font-serif italic text-slate-200 tracking-tight leading-snug">镇武孤城 {getVersionDisplay()}</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                            <button 
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={cn(
                                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all outline-none mobile-touch-target",
                                    isActive 
                                        ? "bg-orange-600/10 border border-orange-500/30 text-orange-500 shadow-sm" 
                                        : "border border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 opacity-80 hover:opacity-100"
                                )}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="font-medium tracking-wide">{t.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/5 text-[10px] text-slate-600 font-mono tracking-widest uppercase flex justify-between items-center">
                    <span>Project Zhenwu</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setUpdateLogModal(true)} className="hover:text-orange-500 transition-colors p-1" title="查看更新公告">
                            <ScrollText className="w-4 h-4" />
                        </button>
                        <button onClick={() => setResetModal(true)} className="hover:text-red-500 transition-colors p-1" title="重置游戏进度">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
             </aside>

             {/* Main Content Area */}
             <main className="flex-1 flex flex-col relative overflow-hidden z-10 min-h-0">
                  {/* Header - optimized for mobile */}
                  <header className="shrink-0 bg-black/40 border-b border-white/10 backdrop-blur-md flex items-center px-3 sm:px-4 lg:px-8 justify-between gap-2 h-12 sm:h-14 lg:h-16">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 bg-orange-600/20 border border-orange-500/50 flex items-center justify-center rounded-sm rotate-45 shrink-0">
                              <div className="-rotate-45 font-bold text-orange-500 text-xs sm:text-sm font-serif">武</div>
                          </div>
                          <h2 className="text-sm sm:text-base lg:text-lg font-serif italic text-slate-200 tracking-tight sm:tracking-tight leading-tight">
                              {tabs.find(t => t.id === activeTab)?.label}
                          </h2>
                      </div>
                      <TopResourceBar />
                      <div className="flex items-center gap-1.5">
                          <button onClick={() => setUpdateLogModal(true)} className="text-slate-500 hover:text-orange-500 transition-colors p-1.5 shrink-0" title="查看更新公告">
                              <ScrollText className="w-4 h-4" />
                          </button>
                          <button onClick={() => setResetModal(true)} className="lg:hidden text-slate-500 hover:text-red-500 transition-colors p-1.5 shrink-0" title="重置游戏进度">
                              <Settings className="w-4 h-4" />
                          </button>
                      </div>
                  </header>

                  {/* Content scroll area — optimized for mobile with proper padding for bottom nav */}
                  <div className="flex-1 overflow-y-auto relative mobile-scroll custom-scrollbar pb-24 lg:pb-8 p-3 sm:p-4 lg:p-8">
                       {activeTab === 'city' && <CityPanel />}
                       {activeTab === 'hospital' && <HospitalPanel />}
                       {activeTab === 'market' && <MarketPanel />}
                       {activeTab === 'barracks' && <BarracksPanel />}
                       {activeTab === 'forge' && <ForgePanel />}
                       {activeTab === 'heroes' && <HeroesPanel />}
                       {activeTab === 'warehouse' && <WarehousePanel />}
                       {activeTab === 'gate' && <GatePanel />}
                  </div>

                  {/* Mobile Bottom Tab Bar - optimized layout */}
                  <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
                      <div className="flex justify-around items-center h-14 sm:h-16 px-0.5">
                          {tabs.map((t) => {
                              const Icon = t.icon;
                              const isActive = activeTab === t.id;
                              return (
                                  <button
                                      key={t.id}
                                      onClick={() => setActiveTab(t.id)}
                                      className={cn(
                                          "flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all min-w-0 flex-1 max-w-[16%] mobile-touch-target",
                                          isActive
                                              ? "text-orange-500"
                                              : "text-slate-500 hover:text-slate-300"
                                      )}
                                  >
                                      <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")}/>
                                      <span className={cn("text-[8px] sm:text-[9px] font-medium truncate w-full text-center leading-tight", isActive && "font-bold")}>{t.label}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </nav>
             </main>

             {/* Offline Modal */}
             {offlineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-[#0d0f12] border border-white/10 p-6 lg:p-8 rounded-xl max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/10 blur-2xl pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-4 text-orange-100 tracking-wide font-serif relative z-10">离线纪事</h3>
                        <p className="text-slate-300 mb-6 relative z-10 text-sm">将军不在营中之时，将士们已为您筹集了物资。</p>
                        <div className="bg-black/40 p-4 rounded-lg mb-6 border border-white/5 flex items-center justify-between relative z-10">
                             <span className="text-slate-400 text-sm">获得兵饷</span>
                             <span className="text-amber-400 font-mono font-bold">+{offlineModal.amount}</span>
                        </div>
                        <button 
                            onClick={() => setOfflineModal(null)}
                            className="relative z-10 w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)]"
                        >
                            收入库中
                        </button>
                    </div>
                </div>
             )}

             {/* Reset Modal */}
             {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-[#0d0f12] border border-white/10 p-6 lg:p-8 rounded-xl max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/10 blur-2xl pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-4 text-red-100 tracking-wide font-serif relative z-10">破釜沉舟</h3>
                        <p className="text-slate-300 mb-6 relative z-10 text-sm">将军，此举将散尽家财，解散大军，回到初入孤城之时，您确定要如此吗？</p>
                        <div className="flex space-x-4 relative z-10">
                            <button 
                                onClick={() => setResetModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all"
                            >
                                收回成命
                            </button>
                            <button 
                                onClick={() => {
                                    useGameStore.getState().resetGame();
                                    setResetModal(false);
                                }}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)]"
                            >
                                确定重置
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* Update Log Modal */}
             {updateLogModal && (
                <UpdateLog onClose={() => setUpdateLogModal(false)} />
             )}
        </div>
    );
}

function TopResourceBar() {
    const { resources, buildings } = useGameStore();

    const houseLvl = buildings.houseLevel || 1;
    const farmLvl = buildings.farmLevel || 1;
    const woodLvl = buildings.lumberCampLevel || 1;

    const maxPop = houseLvl * 100;
    const pop = Math.floor(resources.population || 100);

    const bingxiangRate = Math.floor(pop * 0.01 * 60);
    const foodRate = Math.floor(farmLvl * 2 * 60);
    const woodRate = Math.floor(woodLvl * 1.5 * 60);

    return (
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-6 lg:overflow-visible overflow-x-auto">
            <ResourceItem label="人口" value={`${pop}/${maxPop}`} color="text-indigo-200" dotColor="bg-indigo-500" icon="👤" />
            <ResourceItem label="粮草" value={resources.food} color="text-emerald-200" dotColor="bg-emerald-500" sub={`+${foodRate}/m`} icon="🌾" />
            <ResourceItem label="木材" value={resources.wood} color="text-orange-200" dotColor="bg-orange-700" sub={`+${woodRate}/m`} icon="🪵" />
            <ResourceItem label="兵饷" value={resources.bingxiang} color="text-amber-200" dotColor="bg-amber-500" sub={`+${bingxiangRate}/m`} icon="🪙" />
            <ResourceItem label="铁锭" value={resources.iron} color="text-slate-200" dotColor="bg-slate-400" icon="⛏️" />
            <ResourceItem label="陨铁" value={resources.meteorite} color="text-cyan-200" dotColor="bg-cyan-400" icon="✨" />
        </div>
    );
}

function ResourceItem({ label, value, color, dotColor, sub, icon }: {
    label: string;
    value: number | string;
    color: string;
    dotColor: string;
    sub?: string;
    icon: string;
}) {
    return (
        <div className="flex items-center gap-0.5 sm:gap-1.5 sm:flex-col sm:items-end whitespace-nowrap shrink-0">
             <div className="flex items-center gap-0.5 sm:gap-1.5">
                 <span className="text-[10px] hidden sm:inline">{icon}</span>
                 <div className={cn("w-1.5 h-1.5 sm:w-1 sm:h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0", dotColor)}></div>
                 <span className={cn("font-mono text-[9px] sm:text-xs", color)}>
                     {typeof value === 'number' ? Math.floor(value).toLocaleString() : value}
                 </span>
                 <span className="text-[7px] text-slate-500 sm:hidden">{label}</span>
             </div>
             <span className="text-[8px] lg:text-[10px] text-slate-500 hidden sm:inline">{label}</span>
             {sub && <span className="text-[6px] sm:text-[7px] text-slate-600 leading-none hidden lg:block">{sub}</span>}
        </div>
    );
}
