import { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useGameStore } from '../store';
import { Building, Hammer, Map, Users, Tent, HeartPulse, Store, Settings, Package, ScrollText, Trophy, ClipboardList, BookOpen } from 'lucide-react';
import UpdateLog from './UpdateLog';
import AchievementPanel from './AchievementPanel';
import QuestBoard from './QuestBoard';
import StoryPanel from './StoryPanel';
import TutorialOverlay from './TutorialOverlay';
import { ResourceItem } from './ResourceItem';
import { TabButton } from './TabButton';
import { getVersionDisplay } from '../version';

const CityPanel = lazy(() => import('./CityPanel'));
const ForgePanel = lazy(() => import('./ForgePanel'));
const HeroesPanel = lazy(() => import('./HeroesPanel'));
const GatePanel = lazy(() => import('./GatePanel'));
const BarracksPanel = lazy(() => import('./BarracksPanel'));
const HospitalPanel = lazy(() => import('./HospitalPanel'));
const MarketPanel = lazy(() => import('./MarketPanel'));
const WarehousePanel = lazy(() => import('./WarehousePanel'));

function PanelSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/5 rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}

type Tab = 'city' | 'hospital' | 'market' | 'forge' | 'heroes' | 'gate' | 'barracks' | 'warehouse';

export default function MainUI() {
    const [activeTab, setActiveTab] = useState<Tab>('city');
    const tick = useGameStore((state) => state.tick);
    const claimOffline = useGameStore((state) => state.claimOffline);
    const lastTickTime = useGameStore((state) => state.lastTickTime);
    const [offlineModal, setOfflineModal] = useState<{ amount: number } | null>(null);
    const [resetModal, setResetModal] = useState(false);
    const [updateLogModal, setUpdateLogModal] = useState(false);
const [achievementModal, setAchievementModal] = useState(false);
    const [questBoardOpen, setQuestBoardOpen] = useState(false);
    const [storyModalOpen, setStoryModalOpen] = useState(false);

    const tickRef = useRef(tick);
    tickRef.current = tick;

    const claimOfflineRef = useRef(claimOffline);
    claimOfflineRef.current = claimOffline;

    useEffect(() => {
        const now = Date.now();
        const deltaMs = now - lastTickTime;
        const offlineMins = Math.floor(deltaMs / 60000);
        if (offlineMins >= 10) {
            const capMins = Math.min(offlineMins, 12 * 60);
            const gains = capMins * 48;
            setOfflineModal({ amount: Math.floor(gains) });
            claimOfflineRef.current(Math.floor(gains));
        }

        const interval = setInterval(() => {
            tickRef.current();
        }, 1000);

        return () => clearInterval(interval);
    }, [lastTickTime]);

    const tabs = useMemo(() => [
        { id: 'city', label: '主城署', icon: Building },
        { id: 'hospital', label: '医馆', icon: HeartPulse },
        { id: 'market', label: '集市', icon: Store },
        { id: 'barracks', label: '募兵营', icon: Tent },
        { id: 'forge', label: '兵甲坊', icon: Hammer },
        { id: 'heroes', label: '门客', icon: Users },
        { id: 'warehouse', label: '库房', icon: Package },
        { id: 'gate', label: '城门', icon: Map },
    ] as const, []);

    const handleTabChange = useCallback((tabId: Tab) => {
        setActiveTab(tabId);
    }, []);

    const handleUpdateLogModal = useCallback(() => {
        setUpdateLogModal(true);
    }, []);

    const handleResetModal = useCallback(() => {
        setResetModal(true);
    }, []);

    const handleCloseOfflineModal = useCallback(() => {
        setOfflineModal(null);
    }, []);

    const handleConfirmReset = useCallback(() => {
        useGameStore.getState().resetGame();
        setResetModal(false);
        setActiveTab('city');
    }, []);

    const handleCloseUpdateLog = useCallback(() => {
        setUpdateLogModal(false);
    }, []);

const handleAchievementModal = useCallback(() => {
        setAchievementModal(true);
    }, []);

    const handleCloseAchievement = useCallback(() => {
        setAchievementModal(false);
    }, []);

    const handleQuestBoardOpen = useCallback(() => {
        setQuestBoardOpen(true);
    }, []);

    const handleCloseQuestBoard = useCallback(() => {
        setQuestBoardOpen(false);
    }, []);

    const handleStoryModalOpen = useCallback(() => {
        setStoryModalOpen(true);
    }, []);

    const handleCloseStoryModal = useCallback(() => {
        setStoryModalOpen(false);
    }, []);
    return (
        <div className="flex w-full h-screen bg-[#0d0f12] text-slate-200 font-sans overflow-hidden relative select-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,transparent_70%)] opacity-40 pointer-events-none"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-900/10 blur-[120px] rounded-full pointer-events-none"></div>

             {/* Desktop Sidebar — hidden on mobile */}
             <aside className="hidden lg:flex w-64 bg-black/60 border-r border-white/5 flex-col shrink-0 relative z-10 backdrop-blur-md flex-col">
                <div className="p-5 sm:p-6 border-b border-white/5 flex items-center gap-3">
                     <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-600/20 border border-orange-500/50 flex items-center justify-center rounded-sm rotate-45 shrink-0">
                         <div className="-rotate-45 font-bold text-orange-500 text-lg sm:text-xl font-serif">武</div>
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold leading-none">Zhenwu City</span>
                        <span className="text-sm sm:text-base font-serif italic text-slate-200 tracking-wide leading-tight whitespace-nowrap">镇武孤城 {getVersionDisplay()}</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                    {tabs.map((t) => (
                        <TabButton
                            key={t.id}
                            t={t}
                            isActive={activeTab === t.id}
                            onClick={() => handleTabChange(t.id)}
                            dataTabId={t.id}
                        />
                    ))}
                </nav>
                <div className="p-4 border-t border-white/5 text-[10px] text-slate-600 font-mono tracking-widest uppercase flex justify-between items-center">
                    <span>Project Zhenwu</span>
                    <div className="flex items-center gap-2">
<button onClick={handleStoryModalOpen} data-tutorial-target="story-panel-btn" className="hover:text-orange-400 transition-colors p-1 relative" title="镇武纪">
                            <BookOpen className="w-4 h-4" />
                        </button>
<button onClick={handleQuestBoardOpen} data-tutorial-target="quest-board-btn" className="hover:text-emerald-500 transition-colors p-1" title="查看任务">
                            <ClipboardList className="w-4 h-4" />
                        </button>
                        <button onClick={handleAchievementModal} className="hover:text-amber-500 transition-colors p-1" title="查看功勋簿">
                            <Trophy className="w-4 h-4" />
                        </button>
                        <button onClick={handleUpdateLogModal} className="hover:text-orange-500 transition-colors p-1" title="查看更新公告">
                            <ScrollText className="w-4 h-4" />
                        </button>
                        <button onClick={handleResetModal} className="hover:text-red-500 transition-colors p-1" title="重置游戏进度">
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
<button onClick={handleStoryModalOpen} data-tutorial-target="story-panel-btn" className="text-slate-500 hover:text-orange-400 transition-colors p-1.5 shrink-0" title="镇武纪">
                              <BookOpen className="w-4 h-4" />
                          </button>
                          <button onClick={handleQuestBoardOpen} data-tutorial-target="quest-board-btn" className="text-slate-500 hover:text-emerald-500 transition-colors p-1.5 shrink-0" title="查看任务">
                              <ClipboardList className="w-4 h-4" />
                          </button>
                          <button onClick={handleAchievementModal} data-tutorial-target="achievement-btn" className="text-slate-500 hover:text-amber-500 transition-colors p-1.5 shrink-0" title="查看功勋簿">
                              <Trophy className="w-4 h-4" />
                          </button>
                          <button onClick={handleUpdateLogModal} className="text-slate-500 hover:text-orange-500 transition-colors p-1.5 shrink-0" title="查看更新公告">
                              <ScrollText className="w-4 h-4" />
                          </button>
                          <button onClick={handleResetModal} className="lg:hidden text-slate-500 hover:text-red-500 transition-colors p-1.5 shrink-0" title="重置游戏进度">
                              <Settings className="w-4 h-4" />
                          </button>
                      </div>
                  </header>

                  {/* Content scroll area — optimized for mobile with proper padding for bottom nav */}
                  <div className="flex-1 overflow-y-auto relative mobile-scroll custom-scrollbar pb-24 lg:pb-8 p-3 sm:p-4 lg:p-8">
                       <Suspense fallback={<PanelSkeleton />}>
                           {activeTab === 'city' && <CityPanel />}
                           {activeTab === 'hospital' && <HospitalPanel />}
                           {activeTab === 'market' && <MarketPanel />}
                           {activeTab === 'barracks' && <BarracksPanel />}
                           {activeTab === 'forge' && <ForgePanel />}
                           {activeTab === 'heroes' && <HeroesPanel />}
                           {activeTab === 'warehouse' && <WarehousePanel />}
                           {activeTab === 'gate' && <GatePanel />}
                       </Suspense>
                  </div>

                  {/* Mobile Bottom Tab Bar - optimized layout */}
                  <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
                      <div className="flex justify-around items-center h-14 sm:h-16 px-0.5">
                          {tabs.map((t) => (
                              <TabButton
                                  key={t.id}
                                  t={t}
                                  isActive={activeTab === t.id}
                                  onClick={() => handleTabChange(t.id)}
                                  variant="mobile"
                                  dataTabId={t.id}
                              />
                          ))}
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
                            onClick={handleCloseOfflineModal}
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
                                onClick={handleConfirmReset}
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
                <UpdateLog onClose={handleCloseUpdateLog} />
             )}
{/* Achievement Panel */}
             <AchievementPanel
                isOpen={achievementModal}
                onClose={handleCloseAchievement}
             />

             {/* Quest Board Modal */}
             <QuestBoard isOpen={questBoardOpen} onClose={handleCloseQuestBoard} />

             {/* Story Panel Modal */}
             <StoryPanel isOpen={storyModalOpen} onClose={handleCloseStoryModal} />

             {/* Tutorial Overlay */}
             <TutorialOverlay />
        </div>
    );
}

function TopResourceBar() {
    const population = useGameStore((state) => state.resources.population);
    const food = useGameStore((state) => state.resources.food);
    const wood = useGameStore((state) => state.resources.wood);
    const bingxiang = useGameStore((state) => state.resources.bingxiang);
    const iron = useGameStore((state) => state.resources.iron);
    const meteorite = useGameStore((state) => state.resources.meteorite);
    const houseLevel = useGameStore((state) => state.buildings.houseLevel);
    const farmLevel = useGameStore((state) => state.buildings.farmLevel);
    const lumberCampLevel = useGameStore((state) => state.buildings.lumberCampLevel);

    const resourceData = useMemo(() => {
        const houseLvl = houseLevel || 1;
        const farmLvl = farmLevel || 1;
        const woodLvl = lumberCampLevel || 1;

        const maxPop = houseLvl * 100;
        const pop = Math.floor(population || 100);

        return {
            pop,
            maxPop,
            bingxiangRate: Math.floor(pop * 0.01 * 60),
            foodRate: Math.floor(farmLvl * 2 * 60),
            woodRate: Math.floor(woodLvl * 1.5 * 60)
        };
    }, [population, houseLevel, farmLevel, lumberCampLevel]);

    return (
        <div data-tutorial-area="top-resource-bar" className="flex items-center gap-1 sm:gap-2 lg:gap-6 lg:overflow-visible overflow-x-auto">
            <ResourceItem label="人口" value={`${resourceData.pop}/${resourceData.maxPop}`} color="text-indigo-200" dotColor="bg-indigo-500" icon="👤" />
            <ResourceItem label="粮草" value={food} color="text-emerald-200" dotColor="bg-emerald-500" sub={`+${resourceData.foodRate}/m`} icon="🌾" />
            <ResourceItem label="木材" value={wood} color="text-orange-200" dotColor="bg-orange-700" sub={`+${resourceData.woodRate}/m`} icon="🪵" />
            <ResourceItem label="兵饷" value={bingxiang} color="text-amber-200" dotColor="bg-amber-500" sub={`+${resourceData.bingxiangRate}/m`} icon="🪙" />
            <ResourceItem label="铁锭" value={iron} color="text-slate-200" dotColor="bg-slate-400" icon="⛏️" />
            <ResourceItem label="陨铁" value={meteorite} color="text-cyan-200" dotColor="bg-cyan-400" icon="✨" />
        </div>
    );
}
