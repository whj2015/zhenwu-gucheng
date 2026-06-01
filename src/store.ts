import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, HeroState, Equipment, PositionKey, WOUNDED_NATURAL_RECOVER_RATE, getWarehouseResourceCap, QuestState, CraftingState, RuinsNode, ManualBattleState, SkillActionType } from './types';
import { HERO_TEMPLATES, FORGE_UPGRADE_COSTS, CRAFTING_TEMPLATES, QUEST_TEMPLATES } from './data';
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
      activeWeeklyIds: []
  } as QuestState,
  achievementState: {
      unlockedIds: [],
      unlockTimes: {},
      notifiedIds: [],
      totalPoints: 0
  },
  manualBattle: null as ManualBattleState | null
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

          let newDailyIds = qs.completedDailyIds;
          let newWeeklyIds = qs.completedWeeklyIds;
          let newLastDailyReset = qs.lastDailyReset;
          let newLastWeeklyReset = qs.lastWeeklyReset;
          let newProgress = { ...qs.progress };
          let newAcceptedIds = qs.acceptedIds || [];
          let newActiveDailyIds = qs.activeDailyIds || [];
          let newActiveWeeklyIds = qs.activeWeeklyIds || [];

          // Initialize daily quests if empty (first-time or after reset)
          if (newActiveDailyIds.length === 0) {
              newActiveDailyIds = Array.from(generateDailyQuests(QUEST_TEMPLATES, 6).keys());
              newActiveDailyIds.forEach((id) => {
                  const template = QUEST_TEMPLATES[id];
                  if (!template) return;
                  if (template.requireType !== 'resource') {
                      newProgress[id] = 0;
                      newAcceptedIds.push(id);
                  }
              });
              if (!newLastDailyReset) newLastDailyReset = now;
          }

          // Check daily reset
          if (now - qs.lastDailyReset >= dayMs) {
              newDailyIds = [];
              newProgress = {};
              newAcceptedIds = [];
              newLastDailyReset = now;

              const dailyPool = generateDailyQuests(QUEST_TEMPLATES, 6);
              newActiveDailyIds = Array.from(dailyPool.keys());

              dailyPool.forEach((template, id) => {
                  if (template.requireType !== 'resource') {
                      newProgress[id] = 0;
                  }
                  if (template.requireType !== 'resource') {
                      newAcceptedIds.push(id);
                  }
              });
          }

          // Initialize weekly quests if empty (first-time or after reset)
          if (newActiveWeeklyIds.length === 0) {
              newActiveWeeklyIds = Array.from(generateWeeklyQuests(QUEST_TEMPLATES, 3).keys());
              newActiveWeeklyIds.forEach((id) => {
                  const template = QUEST_TEMPLATES[id];
                  if (!template) return;
                  if (template.requireType !== 'resource') {
                      newProgress[id] = 0;
                      newAcceptedIds.push(id);
                  }
              });
              if (!newLastWeeklyReset) newLastWeeklyReset = now;
          }

          // Check weekly reset
          if (now - qs.lastWeeklyReset >= weekMs) {
              newWeeklyIds = [];
              newLastWeeklyReset = now;

              const weeklyPool = generateWeeklyQuests(QUEST_TEMPLATES, 3);
              newActiveWeeklyIds = Array.from(weeklyPool.keys());

              weeklyPool.forEach((template, id) => {
                  if (template.requireType !== 'resource') {
                      newProgress[id] = 0;
                      newAcceptedIds.push(id);
                  }
              });
          }

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
                  activeWeeklyIds: newActiveWeeklyIds
              }
          };
      }),

      acceptQuest: (questId) => {
          let success = false;
          set((state) => {
              const qs = state.questState;
              if (qs.acceptedIds?.includes(questId)) return state;
              if (qs.completedDailyIds.includes(questId)) return state;
              if (qs.completedWeeklyIds.includes(questId)) return state;
              
              success = true;
              return {
                  questState: {
                      ...qs,
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

          const newProgress = { ...state.questState.progress };
          for (const [qid] of matchingQuests) {
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

      clearManualBattle: () => set(() => ({ manualBattle: null }))
    }),
    {
      name: 'ironecho-storage',
      storage: createJSONStorage(() => safeStorage)
    }
  )
);
