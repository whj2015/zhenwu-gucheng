import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, HeroState, Equipment, PositionKey, WOUNDED_NATURAL_RECOVER_RATE, getWarehouseResourceCap, QuestState, CraftingState, RuinsNode, ManualBattleState, SkillActionType, StoryState, TutorialState } from './types';
import { HERO_TEMPLATES, FORGE_UPGRADE_COSTS, CRAFTING_TEMPLATES, QUEST_TEMPLATES, STORY_CHAPTERS, getChapter, getNextChapter, createInitialStoryState, createInitialTutorialState } from './data';
import { RESOURCE_CONFIG, BATTLE_CONFIG } from './gameConfig';
import { generateId } from './utils';
import {
    trackAction,
    validateQuestTurnIn,
    generateDailyQuests,
    generateWeeklyQuests
} from './utils/questEngine';
import { checkAchievements } from './utils/achievementEngine';

const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

function createDebouncedSetItem(debounceMs: number = 1000) {
  return (name: string, value: string): void => {
    try {
      const existingTimer = pendingWrites.get(name);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        localStorage.setItem(name, value);
        pendingWrites.delete(name);
      }, debounceMs);

      pendingWrites.set(name, timer);
    } catch (e) {
      console.warn('localStorage is not available, state will not persist.');
    }
  };
}

const debouncedSetItem = createDebouncedSetItem(1000);

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      return null;
    }
  },
  setItem: debouncedSetItem,
  removeItem: (name: string): void => {
    try {
      const existingTimer = pendingWrites.get(name);
      if (existingTimer) {
        clearTimeout(existingTimer);
        pendingWrites.delete(name);
      }
      localStorage.removeItem(name);
    } catch (e) {}
  },
  
  flushAll(): void {
    pendingWrites.forEach((timer) => {
      clearTimeout(timer);
    });
    pendingWrites.clear();
  }
};

const INITIAL_HEROES: HeroState[] = [];

const INITIAL_STATE: GameState = {
  resources: {
    bingxiang: 500, // Initial bingxiang
    iron: 200, // Initial iron
    meteorite: 0,
    food: 1000,
    wood: 500,
    population: 100
  },
  buildings: {
    forgeLevel: 1,
    hospitalLevel: 1,
    marketLevel: 1,
    houseLevel: 1,
    farmLevel: 1,
    lumberCampLevel: 1,
    warehouseLevel: 1
  },
  crafting: {
      task: null,
      consecutiveNormal: 0,
      consecutiveFine: 0,
      totalCrafted: 0
  } as CraftingState,
  heroes: INITIAL_HEROES,
  inventory: [],
  ruinsRun: null,
  acceptedMissions: [] as string[],
  lastTickTime: Date.now(),
  tavernPool: [] as string[],
  tavernRefreshCount: 0,
  recruitStats: {
      totalRecruits: 0,
      sinceLastR: 0,
      sinceLastSR: 0,
      pityR: 10,
      pitySR: 50
  },
  questState: {
      completedDailyIds: [],
      completedWeeklyIds: [],
      lastDailyReset: Date.now(),
      lastWeeklyReset: Date.now(),
      progress: {},
      acceptedIds: [],
      activeDailyIds: [],
      activeWeeklyIds: [],
      availableDailyIds: [],
      availableWeeklyIds: []
  } as QuestState,
  achievementState: {
      unlockedIds: [],
      unlockTimes: {},
      notifiedIds: [],
      totalPoints: 0
  },
  manualBattle: null as ManualBattleState | null,
  activeBattle: null as GameState['activeBattle'],
  storyState: {
    currentChapterId: 'prologue',
    completedChapterIds: [],
    unlockedChapterIds: ['prologue'],
    storyFlags: {},
    readChoices: {},
    lastReadTime: 0,
    unreadChapterIds: ['prologue'],
  } as StoryState,
  tutorialState: {
    completedSteps: [],
    currentStep: 'welcome',
    isTutorialActive: true,
    skipTutorial: false,
    lastShownTime: 0,
  } as TutorialState,
};

export const useGameStore = create<GameState & {
  tick: () => void;
  claimOffline: (amount: number) => void;
  upgradeForge: () => void;
  upgradeBuilding: (buildingId: keyof GameState['buildings'], cost: { wood?: number, food?: number, iron?: number, bingxiang?: number }) => void;
  startCrafting: (templateId: string) => void;
  claimCrafting: () => void;
  equipItem: (heroId: string, slot: 'weapon'|'armor', equipId: string | null) => void;
  beginRun: (missionId: string, party: Record<PositionKey, string | null>, nodes: any) => void;
  updateRun: (updates: Partial<GameState['ruinsRun']>) => void;
  endRun: () => void;
  acceptMission: (missionId: string) => void;
  abandonMission: (missionId: string) => void;
  addResources: (res: Partial<GameState['resources']>) => void;
  healParty: (pct: number) => void;
  recruitTroops: (heroId: string, amount: number, costFood: number, costBingxiang: number) => void;
  recruitHero: (templateId: string, costBingxiang: number) => void;
  recruitHeroWithGacha: () => void;
  healHero: (heroId: string, amount: number, costFood: number) => void;
  tradeResource: (fromType: keyof GameState['resources'], toType: keyof GameState['resources'], fromAmount: number, toAmount: number) => void;
  applyCombatResults: (results: { id: string, hp: number, troops: number, wounded: number}[], won: boolean) => void;
  treatWounded: (heroId: string, amount: number, costFood: number) => void;
  upgradeWarehouse: () => void;
  resetGame: () => void;
  refreshTavern: () => void;
  initTavernPool: () => void;
  checkAndRefreshQuests: () => void;
  turnInQuest: (questId: string) => boolean;
  acceptQuest: (questId: string) => boolean;
  trackQuestProgress: (progressType: string, amount: number) => void;
  checkAndUnlockAchievements: (eventType: string, value: number) => void;
  initManualBattle: (heroIds: string[]) => void;
  setBattleMode: (mode: 'auto' | 'manual') => void;
  spendEnergy: (heroId: string, amount: number) => boolean;
  gainTurnEnergy: (isFirstTurn?: boolean) => void;
  setHeroAction: (heroId: string, action: SkillActionType | null) => void;
  executeManualTurn: () => SkillActionType[];
  togglePause: () => void;
  clearManualBattle: () => void;
  setActiveBattle: (node: RuinsNode | null, enemies: Array<{ id: string; name: string; hp: number; maxHp: number; isAlive: boolean }>) => void;
  clearActiveBattle: () => void;
  // 剧情系统
  readStoryChapter: (chapterId: string) => void;
  makeStoryChoice: (chapterId: string, choiceId: string) => void;
  checkStoryProgress: () => void;
  dismissStoryNotification: (chapterId: string) => void;
  // 新手引导系统
  completeTutorialStep: (stepId: string) => void;
  skipTutorial: () => void;
  setCurrentTutorialStep: (stepId: string | null) => void;
  setTutorialActive: (active: boolean) => void;
}>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      resetGame: () => set(() => ({ ...INITIAL_STATE, lastTickTime: Date.now() })),

      tick: () => set((state) => {
        const now = Date.now();
        const delta = now - state.lastTickTime;
        
        const farmLvl = state.buildings.farmLevel || 1;
        const woodLvl = state.buildings.lumberCampLevel || 1;
        const houseLvl = state.buildings.houseLevel || 1;
        const warehouseLvl = state.buildings.warehouseLevel || 1;

        let pop = state.resources.population ?? 100;
        const maxPop = houseLvl * 100;
        if (pop < maxPop) {
             pop += (delta / 1000) * 0.5;
             if (pop > maxPop) pop = maxPop;
        }

        const bingxiangGained = Math.floor((delta / 1000) * (pop * 0.01));
        const foodGained = Math.floor((delta / 1000) * (farmLvl * 2));
        const woodGained = Math.floor((delta / 1000) * (woodLvl * 1.5));
        const ironGained = Math.floor((delta / 1000) * (warehouseLvl * 0.8));

        const resourceCap = getWarehouseResourceCap(warehouseLvl);

        const woundedRecover = (delta / 1000) * WOUNDED_NATURAL_RECOVER_RATE;
        const newHeroes = state.heroes.map(h => {
            if (h.wounded <= 0) return h;
            const recoverAmount = Math.floor(h.wounded * woundedRecover);
            if (recoverAmount <= 0) return h;
            return { ...h, wounded: Math.max(0, h.wounded - recoverAmount), troops: h.troops + recoverAmount };
        });

        return {
          resources: {
            ...state.resources,
            population: pop,
            bingxiang: state.resources.bingxiang + bingxiangGained,
            food: state.resources.food + foodGained,
            wood: state.resources.wood + woodGained,
            iron: Math.min(state.resources.iron + ironGained, resourceCap)
          },
          heroes: newHeroes,
          lastTickTime: now
        };
      }),

      claimOffline: (amount) => set((state) => ({
        resources: { ...state.resources, bingxiang: state.resources.bingxiang + amount },
        lastTickTime: Date.now()
      })),

      upgradeForge: () => set((state) => {
        const nextLvl = state.buildings.forgeLevel + 1;
        const cost = FORGE_UPGRADE_COSTS[nextLvl as unknown as keyof typeof FORGE_UPGRADE_COSTS];
        if (!cost) return state;
        if (state.resources.bingxiang >= cost.bingxiang && state.resources.meteorite >= cost.meteorite) {
          const newBuildings = {
            ...state.buildings,
            forgeLevel: nextLvl
          };

          const { newlyUnlocked, newState, totalReward } = checkAchievements(
              'building_upgrade',
              nextLvl,
              state.achievementState,
              {
                  heroes: state.heroes,
                  resources: {
                      ...state.resources,
                      bingxiang: state.resources.bingxiang - cost.bingxiang,
                      meteorite: state.resources.meteorite - cost.meteorite
                  },
                  buildings: newBuildings,
                  crafting: state.crafting,
                  recruitStats: state.recruitStats,
                  ruinsRun: state.ruinsRun
              }
          );

          const cap = getWarehouseResourceCap(newBuildings.warehouseLevel);
          const clamp = (val: number) => Math.max(0, Math.min(cap, val));

          const baseResult = {
            resources: {
              ...state.resources,
              bingxiang: state.resources.bingxiang - cost.bingxiang,
              meteorite: state.resources.meteorite - cost.meteorite
            },
            buildings: newBuildings
          };

          if (newlyUnlocked.length === 0) return baseResult;

          return {
              ...baseResult,
              achievementState: newState,
              resources: {
                  ...baseResult.resources,
                  bingxiang: clamp(baseResult.resources.bingxiang + (totalReward.bingxiang || 0)),
                  iron: clamp(baseResult.resources.iron + (totalReward.iron || 0)),
                  meteorite: clamp(baseResult.resources.meteorite + (totalReward.meteorite || 0)),
                  food: clamp(baseResult.resources.food + (totalReward.food || 0)),
                  wood: clamp(baseResult.resources.wood + (totalReward.wood || 0))
              }
          };
        }
        return state;
      }),

      upgradeBuilding: (buildingId, cost) => set((state) => {
          const res = state.resources;
          if (
              res.wood >= (cost.wood || 0) &&
              res.food >= (cost.food || 0) &&
              res.iron >= (cost.iron || 0) &&
              res.bingxiang >= (cost.bingxiang || 0)
          ) {
              return {
                  resources: {
                      ...state.resources,
                      wood: state.resources.wood - (cost.wood || 0),
                      food: state.resources.food - (cost.food || 0),
                      iron: state.resources.iron - (cost.iron || 0),
                      bingxiang: state.resources.bingxiang - (cost.bingxiang || 0)
                  },
                  buildings: {
                      ...state.buildings,
                      [buildingId]: state.buildings[buildingId] + 1
                  }
              };
          }
          return state;
      }),

      startCrafting: (templateId) => set((state) => {
        const template = CRAFTING_TEMPLATES[templateId];
        if (!template) return state;
        if (state.crafting.task) return state; // already crafting
        if (state.resources.bingxiang >= template.costBingxiang && state.resources.iron >= template.costIron) {
          const now = Date.now();
          return {
            resources: {
              ...state.resources,
              bingxiang: state.resources.bingxiang - template.costBingxiang,
              iron: state.resources.iron - template.costIron
            },
            crafting: {
              ...state.crafting,
              task: {
                id: generateId(),
                templateId,
                startTime: now,
                endTime: now + template.durationMs
              }
            }
          };
        }
        return state;
      }),

      claimCrafting: () => set((state) => {
        if (!state.crafting.task || Date.now() < state.crafting.task.endTime) return state;

        const template = CRAFTING_TEMPLATES[state.crafting.task.templateId];
        const forgeLevel = state.buildings.forgeLevel;
        const { consecutiveNormal, consecutiveFine } = state.crafting;

        let quality: 'normal'|'fine'|'epic' = 'normal';
        let mult = 1;
        let newConsecutiveNormal = consecutiveNormal + 1;
        let newConsecutiveFine = consecutiveFine + 1;

        if (consecutiveNormal >= 4) {
            quality = 'fine';
            mult = 1.2;
            newConsecutiveNormal = 0;
            newConsecutiveFine = consecutiveFine + 1;
        } else if (consecutiveFine >= 9) {
            quality = 'epic';
            mult = 1.5;
            newConsecutiveNormal = 0;
            newConsecutiveFine = 0;
        } else {
            const rand = Math.random() * 100;
            if (rand < 5) {
                quality = 'epic';
                mult = 1.5;
                newConsecutiveNormal = 0;
                newConsecutiveFine = 0;
            } else if (rand < 25) {
                quality = 'fine';
                mult = 1.2;
                newConsecutiveNormal = 0;
                newConsecutiveFine = consecutiveFine + 1;
            } else {
                newConsecutiveFine = 0;
            }
        }

        const generatedEquip: Equipment = {
          id: generateId(),
          templateId: state.crafting.task.templateId,
          type: template.type,
          name: template.name,
          quality,
          attack: Math.floor((template.baseStats[forgeLevel]?.attack || 0) * mult),
          defense: Math.floor((template.baseStats[forgeLevel]?.defense || 0) * mult),
          durability: 100,
          maxDurability: 100
        };
        
        const newProgress = trackAction('craft', 1, state.questState, QUEST_TEMPLATES);

        const newCraftingState = {
            task: null,
            consecutiveNormal: newConsecutiveNormal,
            consecutiveFine: newConsecutiveFine,
            totalCrafted: state.crafting.totalCrafted + 1
        };

        const { newlyUnlocked, newState, totalReward } = checkAchievements(
            'craft',
            newCraftingState.totalCrafted,
            state.achievementState,
            {
                heroes: state.heroes,
                resources: state.resources,
                buildings: state.buildings,
                crafting: newCraftingState as CraftingState,
                recruitStats: state.recruitStats,
                ruinsRun: state.ruinsRun
            }
        );

        const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
        const clamp = (val: number) => Math.max(0, Math.min(cap, val));

        return {
            crafting: newCraftingState,
            inventory: [...state.inventory, generatedEquip],
            questState: {
                ...state.questState,
                progress: newProgress
            },
            ...(newlyUnlocked.length > 0 ? {
                achievementState: newState,
                resources: {
                    ...state.resources,
                    bingxiang: clamp(state.resources.bingxiang + (totalReward.bingxiang || 0)),
                    iron: clamp(state.resources.iron + (totalReward.iron || 0)),
                    meteorite: clamp(state.resources.meteorite + (totalReward.meteorite || 0)),
                    food: clamp(state.resources.food + (totalReward.food || 0)),
                    wood: clamp(state.resources.wood + (totalReward.wood || 0))
                }
            } : {})
        };
      }),

      equipItem: (heroId, slot, equipId) => set((state) => {
         const heroIndex = state.heroes.findIndex(h => h.id === heroId);
         if (heroIndex === -1) return state;
         
         let nextInventory = [...state.inventory];
         const hero = state.heroes[heroIndex];
         const currentEquip = hero.equipment[slot];
         
         let newEquip: Equipment | null = null;
         if (equipId) {
           const invIndex = nextInventory.findIndex(e => e.id === equipId);
           if (invIndex > -1) {
               newEquip = nextInventory.splice(invIndex, 1)[0];
           } else {
               return state; // equip not found
           }
         }
         
         if (currentEquip) {
           nextInventory.push(currentEquip);
         }
         
         const newHeroes = [...state.heroes];
         newHeroes[heroIndex] = {
             ...hero,
             equipment: {
                 ...hero.equipment,
                 [slot]: newEquip
             }
         };

         return {
             heroes: newHeroes,
             inventory: nextInventory
         };
      }),

      beginRun: (missionId, party, nodes) => set((state) => {
          const heroCount = Object.values(party).filter(Boolean).length;
          const foodCost = heroCount * RESOURCE_CONFIG.EXPEDITION_COST_PER_HERO;
          
          if (state.resources.food < foodCost) {
              return state;
          }
          
          return {
              resources: {
                  ...state.resources,
                  food: state.resources.food - foodCost
              },
              ruinsRun: {
                  missionId,
                  currentFloor: 1,
                  nodes: nodes,
                  party,
                  status: 'in_progress',
                  currentNodeId: null,
                  grid: null as (RuinsNode | null)[] | null,
                  fogStates: null as string[] | null
              }
          };
      }),

      updateRun: (updates) => set((state) => ({
          ruinsRun: state.ruinsRun ? { ...state.ruinsRun, ...updates } : null
      })),

      endRun: () => set(() => ({ ruinsRun: null })),

      acceptMission: (missionId) => set((state) => {
          if (state.acceptedMissions.includes(missionId)) return state;
          return { acceptedMissions: [...state.acceptedMissions, missionId] };
      }),

      abandonMission: (missionId) => set((state) => ({
          acceptedMissions: state.acceptedMissions.filter(id => id !== missionId)
      })),

      addResources: (res) => set((state) => {
          const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
          const clamp = (val: number) => Math.max(0, Math.min(cap, val));
          
          return {
              resources: {
                  ...state.resources,
                  bingxiang: clamp(state.resources.bingxiang + (res.bingxiang || 0)),
                  iron: clamp(state.resources.iron + (res.iron || 0)),
                  meteorite: clamp(state.resources.meteorite + (res.meteorite || 0)),
                  food: clamp(state.resources.food + (res.food || 0)),
                  wood: clamp(state.resources.wood + (res.wood || 0)),
                  population: Math.max(0, (state.resources.population ?? 100) + (res.population || 0))
              }
          };
      }),

      recruitHero: (templateId, costBingxiang) => set((state) => {
        if (state.resources.bingxiang < costBingxiang) return state;
        const newHero: HeroState = {
            id: generateId(),
            templateId,
            level: 1,
            exp: 0,
            troops: 0,
            wounded: 0,
            hp: HERO_TEMPLATES[templateId].attributes.physique * 10,
            equipment: { weapon: null, armor: null }
        };
        
        const heroRarity = HERO_TEMPLATES[templateId].rarity || 'N';
        const newSinceLastR = heroRarity === 'N' ? state.recruitStats.sinceLastR + 1 : 0;
        const newSinceLastSR = (heroRarity === 'N' || heroRarity === 'R') ? state.recruitStats.sinceLastSR + 1 : 0;
        
        return {
            resources: {
                ...state.resources,
                bingxiang: state.resources.bingxiang - costBingxiang
            },
            heroes: [...state.heroes, newHero],
            tavernPool: state.tavernPool.filter(id => id !== templateId),
            recruitStats: {
                ...state.recruitStats,
                totalRecruits: state.recruitStats.totalRecruits + 1,
                sinceLastR: newSinceLastR,
                sinceLastSR: newSinceLastSR
            }
        };
      }),
      
      recruitHeroWithGacha: () => set((state) => {
          const baseCost = 150;
          if (state.resources.bingxiang < baseCost) return state;
          
          const hiredIds = new Set(state.heroes.map(h => h.templateId));
          const available = Object.entries(HERO_TEMPLATES)
              .filter(([id]) => !hiredIds.has(id))
              .map(([id, template]) => ({ id, rarity: template.rarity || 'N' }));
          
          if (available.length === 0) return state;
          
          const { sinceLastR, sinceLastSR, pityR, pitySR } = state.recruitStats;
          
          let guaranteedRarity: string | null = null;
          if (sinceLastSR >= pitySR - 1) {
              guaranteedRarity = 'SR';
          } else if (sinceLastR >= pityR - 1) {
              guaranteedRarity = 'R';
          }
          
          let selectedHero: typeof available[0] | null = null;
          
          if (guaranteedRarity) {
              const candidates = available.filter(h => h.rarity === guaranteedRarity);
              if (candidates.length > 0) {
                  selectedHero = candidates[Math.floor(Math.random() * candidates.length)];
              }
          }
          
          if (!selectedHero) {
              const rand = Math.random() * 100;
              let cumulative = 0;
              
              for (const hero of available) {
                  let probability: number;
                  switch (hero.rarity) {
                      case 'SSR': probability = 3; break;
                      case 'SR': probability = 12; break;
                      case 'R': probability = 25; break;
                      default: probability = 60; break;
                  }
                  
                  cumulative += probability;
                  if (rand <= cumulative) {
                      selectedHero = hero;
                      break;
                  }
              }
              
              if (!selectedHero) {
                  selectedHero = available[Math.floor(Math.random() * available.length)];
              }
          }
          
          const newHero: HeroState = {
              id: generateId(),
              templateId: selectedHero.id,
              level: 1,
              exp: 0,
              troops: 0,
              wounded: 0,
              hp: HERO_TEMPLATES[selectedHero.id].attributes.physique * 10,
              equipment: { weapon: null, armor: null }
          };
          
          const newSinceLastR = (selectedHero.rarity === 'N') ? sinceLastR + 1 : 0;
          const newSinceLastSR = (selectedHero.rarity === 'N' || selectedHero.rarity === 'R') ? sinceLastSR + 1 : 0;

          const newHeroesList = [...state.heroes, newHero];
          
          const { newlyUnlocked, newState, totalReward } = checkAchievements(
              'hero_recruit',
              1,
              state.achievementState,
              {
                  heroes: newHeroesList,
                  resources: {
                      ...state.resources,
                      bingxiang: state.resources.bingxiang - baseCost
                  },
                  buildings: state.buildings,
                  crafting: state.crafting,
                  recruitStats: {
                      ...state.recruitStats,
                      totalRecruits: state.recruitStats.totalRecruits + 1,
                      sinceLastR: newSinceLastR,
                      sinceLastSR: newSinceLastSR
                  },
                  ruinsRun: state.ruinsRun
              }
          );

          const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
          const clamp = (val: number) => Math.max(0, Math.min(cap, val));

          return {
              resources: {
                  ...state.resources,
                  bingxiang: clamp((state.resources.bingxiang - baseCost) + (totalReward.bingxiang || 0)),
                  iron: clamp(state.resources.iron + (totalReward.iron || 0)),
                  meteorite: clamp(state.resources.meteorite + (totalReward.meteorite || 0)),
                  food: clamp(state.resources.food + (totalReward.food || 0)),
                  wood: clamp(state.resources.wood + (totalReward.wood || 0))
              },
              heroes: newHeroesList,
              recruitStats: {
                  ...state.recruitStats,
                  totalRecruits: state.recruitStats.totalRecruits + 1,
                  sinceLastR: newSinceLastR,
                  sinceLastSR: newSinceLastSR
              },
              ...(newlyUnlocked.length > 0 ? { achievementState: newState } : {})
          };
      }),

      recruitTroops: (heroId, amount, costFood, costBingxiang) => set((state) => {
        if (state.resources.food < costFood || state.resources.bingxiang < costBingxiang) return state;

        const heroIndex = state.heroes.findIndex(h => h.id === heroId);
        if (heroIndex === -1) return state;
        
        const hero = state.heroes[heroIndex];
        const maxTroops = hero.level * 100;
        const actualAmount = Math.min(amount, maxTroops - hero.troops);
        
        if (actualAmount <= 0) return state;

        const newHeroes = [...state.heroes];
        newHeroes[heroIndex] = { ...hero, troops: hero.troops + actualAmount };

        let actualCostFood = costFood * (actualAmount / amount);
        let actualCostBingxiang = costBingxiang * (actualAmount / amount);
        
        const newProgress = trackAction('recruit', actualAmount, state.questState, QUEST_TEMPLATES);

        return {
          resources: {
            ...state.resources,
            food: state.resources.food - actualCostFood,
            bingxiang: state.resources.bingxiang - actualCostBingxiang
          },
          heroes: newHeroes,
          questState: {
              ...state.questState,
              progress: newProgress
          }
        };
      }),

      healParty: (pct) => set((state) => {
        const hospLvl = state.buildings.hospitalLevel || 1;
        const enhancedPct = pct * (1 + (hospLvl - 1) * 0.15);
        const newHeroes = state.heroes.map(h => {
          const t = HERO_TEMPLATES[h.templateId];
          const maxHp = t.attributes.physique * 10;
          const healAmt = Math.floor(maxHp * enhancedPct);
          let newHp = Math.min(maxHp, h.hp + healAmt);
          let newTroops = h.troops;
          let newWounded = h.wounded || 0;
          if (newWounded > 0) {
              const recoverWounded = Math.floor(newWounded * (0.4 + (hospLvl - 1) * 0.05));
              newWounded = Math.max(0, newWounded - recoverWounded);
              newTroops += recoverWounded;
          }
          return { ...h, hp: newHp, troops: newTroops, wounded: newWounded };
        });
        return { heroes: newHeroes };
      }),

      healHero: (heroId, amount, costFood) => set((state) => {
          const hospLvl = state.buildings.hospitalLevel || 1;
          const discount = (hospLvl - 1) * 0.15;
          const actualCost = Math.floor(costFood * (1 - discount));
          if (state.resources.food < actualCost) return state;
          const heroIndex = state.heroes.findIndex(h => h.id === heroId);
          if (heroIndex === -1) return state;

          const hero = state.heroes[heroIndex];
          const t = HERO_TEMPLATES[hero.templateId];
          const maxHp = t.attributes.physique * 10;

          const actualHeal = Math.min(amount, maxHp - hero.hp);
          if (actualHeal <= 0) return state;

          const newHeroes = [...state.heroes];
          newHeroes[heroIndex] = { ...hero, hp: hero.hp + actualHeal };

          return {
              resources: {
                  ...state.resources,
                  food: state.resources.food - actualCost
              },
              heroes: newHeroes
          };
      }),

      tradeResource: (fromType, toType, fromAmount, toAmount) => set((state) => {
          if (state.resources[fromType] < fromAmount) return state;
          const mktLvl = state.buildings.marketLevel || 1;
          const bonusRate = 1 + (mktLvl - 1) * 0.08;
          const bonusToAmount = mktLvl >= 2 ? Math.floor(toAmount * (bonusRate - 1)) : 0;
          return {
              resources: {
                  ...state.resources,
                  [fromType]: state.resources[fromType] - fromAmount,
                  [toType]: state.resources[toType] + toAmount + bonusToAmount
              }
          };
      }),

      applyCombatResults: (results, won) => set((state) => {
          let newHeroes = [...state.heroes];
          let maxLevel = 0;
          results.forEach(res => {
              const hIdx = newHeroes.findIndex(h => h.id === res.id);
              if (hIdx !== -1) {
                  const h = newHeroes[hIdx];
                  let nextExp = h.exp + (won ? 50 : 10);
                  let nextLvl = h.level;
                  if (nextExp >= nextLvl * 100) {
                      nextExp -= nextLvl * 100;
                      nextLvl++;
                  }
                  if (nextLvl > maxLevel) maxLevel = nextLvl;
                  newHeroes[hIdx] = {
                      ...h,
                      hp: Math.max(0, res.hp),
                      troops: Math.max(0, res.troops),
                      wounded: Math.max(0, res.wounded),
                      exp: nextExp,
                      level: nextLvl
                  };
              }
          });

          const newProgress = won 
              ? trackAction('explore', 1, state.questState, QUEST_TEMPLATES)
              : state.questState.progress;

          const baseResult = { 
              heroes: newHeroes,
              questState: {
                  ...state.questState,
                  progress: newProgress
              }
          };

          if (!won) return baseResult;

          const { newlyUnlocked, newState, totalReward } = checkAchievements(
              'battle_win',
              1,
              state.achievementState,
              {
                  heroes: newHeroes,
                  resources: state.resources,
                  buildings: state.buildings,
                  crafting: state.crafting,
                  recruitStats: state.recruitStats,
                  ruinsRun: state.ruinsRun
              }
          );

          if (newlyUnlocked.length === 0) return baseResult;

          const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
          const clamp = (val: number) => Math.max(0, Math.min(cap, val));

          return {
              ...baseResult,
              achievementState: newState,
              resources: {
                  ...state.resources,
                  bingxiang: clamp(state.resources.bingxiang + (totalReward.bingxiang || 0)),
                  iron: clamp(state.resources.iron + (totalReward.iron || 0)),
                  meteorite: clamp(state.resources.meteorite + (totalReward.meteorite || 0)),
                  food: clamp(state.resources.food + (totalReward.food || 0)),
                  wood: clamp(state.resources.wood + (totalReward.wood || 0))
              }
          };
      }),

      treatWounded: (heroId, amount, costFood) => set((state) => {
          const hospLvl = state.buildings.hospitalLevel || 1;
          const discount = (hospLvl - 1) * 0.15;
          const actualCost = Math.floor(costFood * (1 - discount));
          if (state.resources.food < actualCost) return state;
          const heroIndex = state.heroes.findIndex(h => h.id === heroId);
          if (heroIndex === -1 || state.heroes[heroIndex].wounded <= 0) return state;

          const hero = state.heroes[heroIndex];
          const actualTreat = Math.min(amount, hero.wounded);

          const newHeroes = [...state.heroes];
          newHeroes[heroIndex] = {
              ...hero,
              wounded: hero.wounded - actualTreat,
              troops: hero.troops + actualTreat
          };

          return {
              resources: { ...state.resources, food: state.resources.food - actualCost },
              heroes: newHeroes
          };
      }),

      upgradeWarehouse: () => set((state) => {
          const lvl = state.buildings.warehouseLevel;
          const nextLvl = lvl + 1;
          const woodCost = 200 + lvl * 150;
          const ironCost = 80 + lvl * 60;
          const bingxiangCost = 100 + lvl * 80;
          if (state.resources.wood < woodCost || state.resources.iron < ironCost || state.resources.bingxiang < bingxiangCost) return state;
          return {
              resources: {
                  ...state.resources,
                  wood: state.resources.wood - woodCost,
                  iron: state.resources.iron - ironCost,
                  bingxiang: state.resources.bingxiang - bingxiangCost,
              },
              buildings: { ...state.buildings, warehouseLevel: nextLvl }
          };
      }),

      initTavernPool: () => set((state) => {
          if (state.tavernPool.length > 0) return state;
          const hiredIds = new Set(state.heroes.map(h => h.templateId));
          const available = Object.keys(HERO_TEMPLATES).filter(id => !hiredIds.has(id));
          const pool = available.sort(() => Math.random() - 0.5).slice(0, 3);
          return { tavernPool: pool, tavernRefreshCount: 0 };
      }),

      refreshTavern: () => set((state) => {
          const baseCost = 150;
          const increment = 50;
          const maxCost = 500;
          const cost = Math.min(maxCost, baseCost + state.tavernRefreshCount * increment);
          if (state.resources.bingxiang < cost) return state;
          const hiredIds = new Set(state.heroes.map(h => h.templateId));
          const available = Object.keys(HERO_TEMPLATES).filter(id => !hiredIds.has(id));
          if (available.length < 3) return state;
          const pool = available.sort(() => Math.random() - 0.5).slice(0, 3);
          return {
              tavernPool: pool,
              tavernRefreshCount: state.tavernRefreshCount + 1,
              resources: { ...state.resources, bingxiang: state.resources.bingxiang - cost }
          };
      }),

      checkAndRefreshQuests: () => set((state) => {
          const now = Date.now();
          const qs = state.questState;
          const dayMs = 24 * 60 * 60 * 1000;
          const weekMs = 7 * dayMs;

          console.log('[checkAndRefreshQuests] 开始, 输入状态:', {
              availDaily: qs.availableDailyIds?.length,
              activeDaily: qs.activeDailyIds?.length,
              availWeekly: qs.availableWeeklyIds?.length,
              activeWeekly: qs.activeWeeklyIds?.length,
          });

          let newDailyIds = qs.completedDailyIds;
          let newWeeklyIds = qs.completedWeeklyIds;
          let newLastDailyReset = qs.lastDailyReset;
          let newLastWeeklyReset = qs.lastWeeklyReset;
          let newProgress = { ...qs.progress };
          let newAcceptedIds = qs.acceptedIds || [];
          let newActiveDailyIds = qs.activeDailyIds || [];
          let newActiveWeeklyIds = qs.activeWeeklyIds || [];
          let newAvailableDailyIds = qs.availableDailyIds || [];
          let newAvailableWeeklyIds = qs.availableWeeklyIds || [];

          // === 旧存档迁移：有活跃任务但没有可用池 → 移回可用池 ===
          if (newAvailableDailyIds.length === 0 && newActiveDailyIds.length > 0) {
              newAvailableDailyIds = [...newActiveDailyIds];
              newActiveDailyIds = [];
              newAcceptedIds = [];
              newProgress = {};
          }
          if (newAvailableWeeklyIds.length === 0 && newActiveWeeklyIds.length > 0) {
              newAvailableWeeklyIds = [...newActiveWeeklyIds];
              newActiveWeeklyIds = [];
              newAcceptedIds = newAcceptedIds.filter(id => !newAvailableWeeklyIds.includes(id));
              // 清除每周任务的进度
              for (const id of newAvailableWeeklyIds) {
                  delete newProgress[id];
              }
          }

          // Initialize daily quests if empty (first-time or after reset)
          if (newAvailableDailyIds.length === 0 && newActiveDailyIds.length === 0) {
              newAvailableDailyIds = Array.from(generateDailyQuests(QUEST_TEMPLATES, 6).keys());
              if (!newLastDailyReset) newLastDailyReset = now;
          }

          // Check daily reset
          if (now - qs.lastDailyReset >= dayMs) {
              newDailyIds = [];
              newProgress = {};
              newAcceptedIds = [];
              newLastDailyReset = now;

              const dailyPool = generateDailyQuests(QUEST_TEMPLATES, 6);
              newAvailableDailyIds = Array.from(dailyPool.keys());
              newActiveDailyIds = [];
          }

          // Initialize weekly quests if empty (first-time or after reset)
          if (newAvailableWeeklyIds.length === 0 && newActiveWeeklyIds.length === 0) {
              newAvailableWeeklyIds = Array.from(generateWeeklyQuests(QUEST_TEMPLATES, 3).keys());
              if (!newLastWeeklyReset) newLastWeeklyReset = now;
          }

          // Check weekly reset
          if (now - qs.lastWeeklyReset >= weekMs) {
              newWeeklyIds = [];
              newLastWeeklyReset = now;

              const weeklyPool = generateWeeklyQuests(QUEST_TEMPLATES, 3);
              newAvailableWeeklyIds = Array.from(weeklyPool.keys());
              newActiveWeeklyIds = [];
          }

          // === 最终安全网：确保可用池永远不为空 ===
          if (newAvailableDailyIds.length === 0 && newActiveDailyIds.length === 0) {
              newAvailableDailyIds = Array.from(generateDailyQuests(QUEST_TEMPLATES, 6).keys());
              if (!newLastDailyReset) newLastDailyReset = now;
          }
          if (newAvailableWeeklyIds.length === 0 && newActiveWeeklyIds.length === 0) {
              newAvailableWeeklyIds = Array.from(generateWeeklyQuests(QUEST_TEMPLATES, 3).keys());
              if (!newLastWeeklyReset) newLastWeeklyReset = now;
          }

          console.log('[checkAndRefreshQuests] 返回状态:', {
              availDaily: newAvailableDailyIds.length,
              activeDaily: newActiveDailyIds.length,
              availWeekly: newAvailableWeeklyIds.length,
              activeWeekly: newActiveWeeklyIds.length,
          });

          return {
              questState: {
                  ...qs,
                  completedDailyIds: newDailyIds,
                  completedWeeklyIds: newWeeklyIds,
                  lastDailyReset: newLastDailyReset,
                  lastWeeklyReset: newLastWeeklyReset,
                  progress: newProgress,
                  acceptedIds: newAcceptedIds,
                  activeDailyIds: newActiveDailyIds,
                  activeWeeklyIds: newActiveWeeklyIds,
                  availableDailyIds: newAvailableDailyIds,
                  availableWeeklyIds: newAvailableWeeklyIds
              }
          };
      }),

      acceptQuest: (questId) => {
          let success = false;
          set((state) => {
              const qs = state.questState;
              // 检查是否已在活跃或已完成列表
              if (qs.acceptedIds?.includes(questId)) return state;
              if (qs.activeDailyIds?.includes(questId)) return state;
              if (qs.activeWeeklyIds?.includes(questId)) return state;
              if (qs.completedDailyIds.includes(questId)) return state;
              if (qs.completedWeeklyIds.includes(questId)) return state;

              // 确认任务在可用池中
              const isAvailableDaily = qs.availableDailyIds?.includes(questId);
              const isAvailableWeekly = qs.availableWeeklyIds?.includes(questId);
              if (!isAvailableDaily && !isAvailableWeekly) return state;

              success = true;

              // 判断是每日还是每周任务
              const template = QUEST_TEMPLATES[questId];
              const isDaily = template?.category === 'daily';

              return {
                  questState: {
                      ...qs,
                      // 从可用池移除
                      availableDailyIds: isDaily
                          ? (qs.availableDailyIds || []).filter(id => id !== questId)
                          : qs.availableDailyIds,
                      availableWeeklyIds: !isDaily
                          ? (qs.availableWeeklyIds || []).filter(id => id !== questId)
                          : qs.availableWeeklyIds,
                      // 添加到活跃列表
                      activeDailyIds: isDaily
                          ? [...(qs.activeDailyIds || []), questId]
                          : qs.activeDailyIds,
                      activeWeeklyIds: !isDaily
                          ? [...(qs.activeWeeklyIds || []), questId]
                          : qs.activeWeeklyIds,
                      // 标记为已接取
                      acceptedIds: [...(qs.acceptedIds || []), questId]
                  }
              };
          });
          return success;
      },

      turnInQuest: (questId) => {
          let success = false;
          set((state) => {
              const template = QUEST_TEMPLATES[questId];
              if (!template) return state;

              // Use engine to validate
              const validation = validateQuestTurnIn(questId, template, state);
              if (!validation.valid) return state;

              // Process turn-in
              const qs = state.questState;
              const newCompletedIds = template.category === 'daily'
                  ? [...qs.completedDailyIds, questId]
                  : [...qs.completedWeeklyIds, questId];

              success = true;
              return {
                  resources: { 
                      ...state.resources, 
                      ...(validation.resourceGains || {}),
                      ...(validation.resourceCosts || {})
                  },
                  questState: {
                      ...qs,
                      [template.category === 'daily' ? 'completedDailyIds' : 'completedWeeklyIds']: newCompletedIds
                  }
              };
          });
          return success;
      },

      trackQuestProgress: (progressType, amount) => set((state) => {
          const matchingQuests = Object.entries(QUEST_TEMPLATES)
              .filter(([, q]) => {
                  if (q.requireType === progressType) return true;
                  if (q.requireType === 'resource' && q.resourceKey === progressType) return true;
                  return false;
              });

          if (matchingQuests.length === 0) return state;

          // 只追踪已接取（在活跃列表中）的任务
          const activeIds = new Set([
              ...(state.questState.activeDailyIds || []),
              ...(state.questState.activeWeeklyIds || [])
          ]);

          const newProgress = { ...state.questState.progress };
          for (const [qid] of matchingQuests) {
              // 跳过未接取和已完成的任务
              if (!activeIds.has(qid)) continue;
              if (state.questState.completedDailyIds.includes(qid)) continue;
              if (state.questState.completedWeeklyIds.includes(qid)) continue;
              newProgress[qid] = Math.min(
                  QUEST_TEMPLATES[qid].amount,
                  (newProgress[qid] || 0) + amount
              );
          }

          return {
              questState: { ...state.questState, progress: newProgress }
          };
      }),

      checkAndUnlockAchievements: (eventType, value) => set((state) => {
          const { newlyUnlocked, newState, totalReward } = checkAchievements(
              eventType,
              value,
              state.achievementState,
              {
                  heroes: state.heroes,
                  resources: state.resources,
                  buildings: state.buildings,
                  crafting: state.crafting,
                  recruitStats: state.recruitStats,
                  ruinsRun: state.ruinsRun
              }
          );

          if (newlyUnlocked.length === 0) return state;

          const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
          const clamp = (val: number) => Math.max(0, Math.min(cap, val));

          return {
              achievementState: newState,
              resources: {
                  ...state.resources,
                  bingxiang: clamp(state.resources.bingxiang + (totalReward.bingxiang || 0)),
                  iron: clamp(state.resources.iron + (totalReward.iron || 0)),
                  meteorite: clamp(state.resources.meteorite + (totalReward.meteorite || 0)),
                  food: clamp(state.resources.food + (totalReward.food || 0)),
                  wood: clamp(state.resources.wood + (totalReward.wood || 0))
              }
          };
      }),

      initManualBattle: (heroIds) => set(() => {
          const heroEnergy: Record<string, { current: number; max: number; perTurnGain: number }> = {};
          const pendingActions: Record<string, SkillActionType | null> = {};

          heroIds.forEach(id => {
              heroEnergy[id] = {
                  current: BATTLE_CONFIG.ENERGY.INITIAL + BATTLE_CONFIG.ENERGY.FIRST_TURN_BONUS,
                  max: BATTLE_CONFIG.ENERGY.MAX,
                  perTurnGain: BATTLE_CONFIG.ENERGY.PER_TURN_GAIN
              };
              pendingActions[id] = null;
          });

          return {
              manualBattle: {
                  mode: 'auto',
                  heroEnergy,
                  pendingActions,
                  turnTimeLimit: BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT,
                  turnTimeRemaining: BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT,
                  isPaused: false
              }
          };
      }),

      setBattleMode: (mode) => set((state) => {
          if (!state.manualBattle) return state;
          return {
              manualBattle: {
                  ...state.manualBattle,
                  mode,
                  turnTimeRemaining: mode === 'manual' ? BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT : state.manualBattle.turnTimeRemaining
              }
          };
      }),

      spendEnergy: (heroId, amount) => {
          let success = false;
          set((state) => {
              if (!state.manualBattle) return state;
              const energy = state.manualBattle.heroEnergy[heroId];
              if (!energy || energy.current < amount) return state;

              success = true;
              return {
                  manualBattle: {
                      ...state.manualBattle,
                      heroEnergy: {
                          ...state.manualBattle.heroEnergy,
                          [heroId]: { ...energy, current: energy.current - amount }
                      }
                  }
              };
          });
          return success;
      },

      gainTurnEnergy: (isFirstTurn = false) => set((state) => {
          if (!state.manualBattle) return state;

          const gain = isFirstTurn 
              ? BATTLE_CONFIG.ENERGY.FIRST_TURN_BONUS 
              : BATTLE_CONFIG.ENERGY.PER_TURN_GAIN;

          const newHeroEnergy = { ...state.manualBattle.heroEnergy };
          Object.keys(newHeroEnergy).forEach(heroId => {
              const energy = newHeroEnergy[heroId];
              newHeroEnergy[heroId] = {
                  ...energy,
                  current: Math.min(energy.max, energy.current + gain)
              };
          });

          const newPendingActions: Record<string, SkillActionType | null> = {};
          Object.keys(state.manualBattle.pendingActions).forEach(heroId => {
              newPendingActions[heroId] = null;
          });

          return {
              manualBattle: {
                  ...state.manualBattle,
                  heroEnergy: newHeroEnergy,
                  pendingActions: newPendingActions,
                  turnTimeRemaining: BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT
              }
          };
      }),

      setHeroAction: (heroId, action) => set((state) => {
          if (!state.manualBattle) return state;
          
          const pendingAction = action ?? null;
          let newEnergy = state.manualBattle.heroEnergy;

          if (action && action.type === 'defend') {
              const energy = state.manualBattle.heroEnergy[heroId];
              if (energy) {
                  newEnergy = {
                      ...newEnergy,
                      [heroId]: {
                          ...energy,
                          current: Math.min(energy.max, energy.current + BATTLE_CONFIG.ENERGY.DEFEND_ENERGY_GAIN)
                      }
                  };
              }
          }

          if (action && action.type === 'skip') {
              const energy = state.manualBattle.heroEnergy[heroId];
              if (energy) {
                  newEnergy = {
                      ...newEnergy,
                      [heroId]: {
                          ...energy,
                          current: Math.min(energy.max, energy.current + BATTLE_CONFIG.ENERGY.SKIP_ENERGY_GAIN)
                      }
                  };
              }
          }

          return {
              manualBattle: {
                  ...state.manualBattle,
                  heroEnergy: newEnergy,
                  pendingActions: {
                      ...state.manualBattle.pendingActions,
                      [heroId]: pendingAction
                  }
              }
          };
      }),

      executeManualTurn: () => {
          let actions: SkillActionType[] = [];
          set((state) => {
              if (!state.manualBattle) return state;

              actions = Object.values(state.manualBattle.pendingActions).filter(
                  (a): a is SkillActionType => a !== null
              );

              const newPendingActions: Record<string, SkillActionType | null> = {};
              Object.keys(state.manualBattle.pendingActions).forEach(heroId => {
                  newPendingActions[heroId] = null;
              });

              return {
                  manualBattle: {
                      ...state.manualBattle,
                      pendingActions: newPendingActions,
                      turnTimeRemaining: BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT
                  }
              };
          });
          return actions;
      },

      togglePause: () => set((state) => {
          if (!state.manualBattle) return state;
          return {
              manualBattle: {
                  ...state.manualBattle,
                  isPaused: !state.manualBattle.isPaused
              }
          };
      }),

      clearManualBattle: () => set(() => ({ manualBattle: null })),

      setActiveBattle: (node, enemies) => set(() => ({
          activeBattle: { node, enemies }
      })),

      clearActiveBattle: () => set(() => ({ activeBattle: null })),

      // ==================== 剧情系统 Actions ====================

      /** 阅读章节（标记已读，发放奖励） */
      readStoryChapter: (chapterId: string) => set((state) => {
          const chapter = STORY_CHAPTERS[chapterId];
          if (!chapter) return state;
          const ss = state.storyState;

          // 已完成的不重复处理
          if (ss.completedChapterIds.includes(chapterId)) return state;

          const completedIds = [...ss.completedChapterIds, chapterId];
          const unreadIds = ss.unreadChapterIds.filter(id => id !== chapterId);

          // 解锁下一章
          const nextId = getNextChapter(chapterId, ss);
          let unlockedIds = [...ss.unlockedChapterIds];
          if (nextId && !unlockedIds.includes(nextId)) {
              unlockedIds = [...unlockedIds, nextId];
              if (!unreadIds.includes(nextId)) {
                  unreadIds.push(nextId);
              }
          }

          // 发放章节奖励
          const rewardResources: Partial<GameState['resources']> = {};
          if (chapter.rewards) {
              const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
              const clamp = (val: number) => Math.max(0, Math.min(cap, val));
              if (chapter.rewards.bingxiang) rewardResources.bingxiang = clamp(state.resources.bingxiang + chapter.rewards.bingxiang);
              if (chapter.rewards.iron) rewardResources.iron = clamp(state.resources.iron + chapter.rewards.iron);
              if (chapter.rewards.meteorite) rewardResources.meteorite = clamp(state.resources.meteorite + (chapter.rewards.meteorite || 0));
              if (chapter.rewards.food) rewardResources.food = clamp(state.resources.food + (chapter.rewards.food || 0));
              if (chapter.rewards.wood) rewardResources.wood = clamp(state.resources.wood + (chapter.rewards.wood || 0));
              if (chapter.rewards.population) rewardResources.population = Math.max(0, (state.resources.population || 100) + (chapter.rewards.population || 0));
          }

          return {
              storyState: {
                  ...ss,
                  currentChapterId: nextId || chapterId,
                  completedChapterIds: completedIds,
                  unlockedChapterIds: unlockedIds,
                  unreadChapterIds: unreadIds,
                  lastReadTime: Date.now(),
              },
              ...(Object.keys(rewardResources).length > 0 ? { resources: { ...state.resources, ...rewardResources } } : {}),
          };
      }),

      /** 做出剧情选择 */
      makeStoryChoice: (chapterId: string, choiceId: string) => set((state) => {
          const chapter = STORY_CHAPTERS[chapterId];
          if (!chapter?.choices) return state;
          const choice = chapter.choices.find(c => c.id === choiceId);
          if (!choice) return state;

          const ss = state.storyState;
          const newReadChoices = { ...ss.readChoices, [`${chapterId}_choice`]: choiceId };

          // 处理选择效果
          let newResources = { ...state.resources };
          let newUnlockedIds = [...ss.unlockedChapterIds];
          let newUnreadIds = [...ss.unreadChapterIds];
          let newFlags = { ...ss.storyFlags };

          if (choice.effect) {
              // 解锁英雄
              if (choice.effect.unlockHero && !state.tavernPool.includes(choice.effect.unlockHero)) {
                  newUnlockedIds = [...newUnlockedIds];
              }
              // 设置剧情标记
              if (choice.effect.storyFlag) {
                  newFlags = { ...newFlags, [choice.effect.storyFlag]: true };
              }
              // 资源奖励
              if (choice.effect.resources) {
                  const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
                  const clamp = (val: number) => Math.max(0, Math.min(cap, val));
                  if (choice.effect.resources.bingxiang) newResources.bingxiang = clamp(newResources.bingxiang + choice.effect.resources.bingxiang);
                  if (choice.effect.resources.iron) newResources.iron = clamp(newResources.iron + choice.effect.resources.iron);
                  if (choice.effect.resources.food) newResources.food = clamp(newResources.food + choice.effect.resources.food);
                  if (choice.effect.resources.wood) newResources.wood = clamp(newResources.wood + choice.effect.resources.wood);
                  if (choice.effect.resources.population) newResources.population = Math.max(0, (newResources.population || 100) + choice.effect.resources.population);
              }

              // 解锁下一章
              if (!newUnlockedIds.includes(choice.nextChapterId)) {
                  newUnlockedIds = [...newUnlockedIds, choice.nextChapterId];
                  if (!newUnreadIds.includes(choice.nextChapterId)) {
                      newUnreadIds.push(choice.nextChapterId);
                  }
              }
          }

          return {
              storyState: {
                  ...ss,
                  readChoices: newReadChoices,
                  storyFlags: newFlags,
                  unlockedChapterIds: newUnlockedIds,
                  unreadChapterIds: newUnreadIds,
              },
              resources: newResources,
          };
      }),

      /** 检查并推进剧情（由里程碑触发） */
      checkStoryProgress: () => set((state) => {
          const ss = state.storyState;
          let changed = false;
          let newUnlockedIds = [...ss.unlockedChapterIds];
          let newUnreadIds = [...ss.unreadChapterIds];

          // 遍历所有未解锁的章节，检查是否满足触发条件
          for (const [id, chapter] of Object.entries(STORY_CHAPTERS)) {
              if (ss.completedChapterIds.includes(id) || newUnlockedIds.includes(id)) continue;
              if (chapter.trigger.type !== 'milestone') continue;

              let shouldUnlock = false;
              const { milestoneType, milestoneValue } = chapter.trigger;

              switch (milestoneType) {
                  case 'hero_count':
                      shouldUnlock = state.heroes.length >= (milestoneValue || 0);
                      break;
                  case 'first_battle':
                      shouldUnlock = state.achievementState.unlockedIds.includes('first_blood');
                      break;
                  case 'first_boss':
                      shouldUnlock = state.achievementState.unlockedIds.includes('boss_slayer_1');
                      break;
                  case 'explore_floor':
                      shouldUnlock = (state.ruinsRun?.currentFloor || 0) >= (milestoneValue || 0);
                      break;
                  case 'forge_count':
                      shouldUnlock = state.crafting.totalCrafted >= (milestoneValue || 0);
                      break;
                  case 'total_level': {
                      const totalLvl = state.heroes.reduce((sum, h) => sum + h.level, 0);
                      shouldUnlock = totalLvl >= (milestoneValue || 0);
                      break;
                  }
                  case 'boss_kill': {
                      const bossAchievement = state.achievementState.unlockedIds.filter(id => id.startsWith('boss_slayer_'));
                      // 根据value判断击败BOSS数量对应的成就
                      const bossCount = milestoneValue === 1 ? 1 : milestoneValue === 5 ? 10 : milestoneValue === 10 ? 50 : 0;
                      shouldUnlock = bossAchievement.length >= (bossCount > 0 ? (bossCount <= 1 ? 1 : bossCount <= 10 ? 2 : 3) : 0);
                      break;
                  }
                  case 'achievement':
                      shouldUnlock = state.achievementState.totalPoints >= (milestoneValue || 0);
                      break;
              }

              if (shouldUnlock) {
                  newUnlockedIds = [...newUnlockedIds, id];
                  if (!newUnreadIds.includes(id)) {
                      newUnreadIds.push(id);
                  }
                  changed = true;
              }
          }

          if (!changed) return state;

          return {
              storyState: {
                  ...ss,
                  unlockedChapterIds: newUnlockedIds,
                  unreadChapterIds: newUnreadIds,
              },
          };
      }),

      /** 标记章节为已通知（移除未读标记） */
      dismissStoryNotification: (chapterId: string) => set((state) => ({
          storyState: {
              ...state.storyState,
              unreadChapterIds: state.storyState.unreadChapterIds.filter(id => id !== chapterId),
          },
      })),

      // ==================== 新手引导系统 Actions ====================

      /** 完成引导步骤 */
      completeTutorialStep: (stepId: string) => set((state) => {
          const ts = state.tutorialState;
          if (ts.completedSteps.includes(stepId)) return state;

          const step = Object.values(require('../data/tutorial').TUTORIAL_STEPS).find(
              (s: any) => s.id === stepId
          ) as any;

          const newCompleted = [...ts.completedSteps, stepId as any];

          // 发放步骤奖励
          let newResources = { ...state.resources };
          if (step?.rewards) {
              const cap = getWarehouseResourceCap(state.buildings.warehouseLevel);
              const clamp = (val: number) => Math.max(0, Math.min(cap, val));
              if (step.rewards.bingxiang) newResources.bingxiang = clamp(newResources.bingxiang + step.rewards.bingxiang);
              if (step.rewards.iron) newResources.iron = clamp(newResources.iron + step.rewards.iron);
              if (step.rewards.food) newResources.food = clamp(newResources.food + step.rewards.food);
              if (step.rewards.wood) newResources.wood = clamp(newResources.wood + step.rewards.wood);
              if (step.rewards.meteorite) newResources.meteorite = clamp(newResources.meteorite + step.rewards.meteorite);
          }

          // 找下一步
          const { getNextTutorialStep } = require('../data/tutorial');
          const nextState: TutorialState = {
              ...ts,
              completedSteps: newCompleted,
              currentStep: null,
              lastShownTime: Date.now(),
          };
          const nextStep = getNextTutorialStep(nextState);

          return {
              tutorialState: {
                  ...nextState,
                  currentStep: nextStep?.id || null,
                  isTutorialActive: nextStep !== null,
              },
              resources: newResources,
          };
      }),

      /** 跳过引导 */
      skipTutorial: () => set((state) => ({
          tutorialState: {
              ...state.tutorialState,
              skipTutorial: true,
              isTutorialActive: false,
              currentStep: null,
          },
      })),

      /** 设置当前引导步骤 */
      setCurrentTutorialStep: (stepId: string | null) => set((state) => ({
          tutorialState: {
              ...state.tutorialState,
              currentStep: stepId,
              lastShownTime: stepId ? Date.now() : state.tutorialState.lastShownTime,
          },
      })),

      /** 暂停/恢复引导 */
      setTutorialActive: (active: boolean) => set((state) => ({
          tutorialState: {
              ...state.tutorialState,
              isTutorialActive: active,
          },
      })),
    }),
    {
      name: 'ironecho-storage',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state: any) => {
          if (!state) return;
          // 存档加载后，迁移旧数据：有活跃任务但没有可用池 → 移回可用池
          const qs = state.questState;
          let needsUpdate = false;
          let newQuestState = { ...qs };

          const hasAvailableDaily = (qs.availableDailyIds?.length || 0) > 0;
          const hasActiveDaily = (qs.activeDailyIds?.length || 0) > 0;
          if (!hasAvailableDaily && hasActiveDaily) {
              newQuestState.availableDailyIds = [...qs.activeDailyIds];
              newQuestState.activeDailyIds = [];
              newQuestState.acceptedIds = [];
              newQuestState.progress = {};
              needsUpdate = true;
          }

          const hasAvailableWeekly = (qs.availableWeeklyIds?.length || 0) > 0;
          const hasActiveWeekly = (qs.activeWeeklyIds?.length || 0) > 0;
          if (!hasAvailableWeekly && hasActiveWeekly) {
              newQuestState.availableWeeklyIds = [...qs.activeWeeklyIds];
              newQuestState.activeWeeklyIds = [...(newQuestState.activeWeeklyIds || [])].filter(
                  id => !qs.activeWeeklyIds.includes(id)
              );
              const weeklyProgress = { ...(newQuestState.progress || {}) };
              for (const id of qs.activeWeeklyIds) {
                  delete weeklyProgress[id];
              }
              newQuestState.progress = weeklyProgress;
              needsUpdate = true;
          }

          if (needsUpdate) {
              state.setState({ questState: newQuestState }, false);
          }
      }
    }
  )
);
