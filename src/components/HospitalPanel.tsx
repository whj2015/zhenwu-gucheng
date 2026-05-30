import React from 'react';
import { useGameStore } from '../store';
import { HERO_TEMPLATES } from '../data';
import { TREAT_COST_PER_WOUNDED } from '../types';
import { cn } from '../utils';
import HeroIcon from './HeroIcon';
import { HeartPulse, Plus, Bandage, Users, Cross, ArrowUpCircle, Sparkles } from 'lucide-react';

const HOSPITAL_BENEFITS = [
    { level: 1, discount: 0, label: "基础医馆" },
    { level: 2, discount: 15, label: "治疗费-15%，伤兵恢复+5%" },
    { level: 3, discount: 30, label: "治疗费-30%，伤兵恢复+10%" },
    { level: 4, discount: 45, label: "治疗费-45%，伤兵恢复+15%" },
];

export default function HospitalPanel() {
    const { heroes, healHero, treatWounded, healParty, resources, buildings, upgradeBuilding } = useGameStore();

    const hospLvl = buildings.hospitalLevel || 1;
    const totalWounded = heroes.reduce((s, h) => s + (h.wounded || 0), 0);
    const discount = (hospLvl - 1) * 15;
    const currentBenefit = HOSPITAL_BENEFITS[Math.min(hospLvl, HOSPITAL_BENEFITS.length) - 1];
    const nextBenefit = hospLvl < HOSPITAL_BENEFITS.length ? HOSPITAL_BENEFITS[hospLvl] : null;
    const upgradeCost = { wood: 80 * hospLvl, iron: 20 * hospLvl };
    const canUpgrade = resources.wood >= upgradeCost.wood && resources.iron >= upgradeCost.iron;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
            <div className="text-center mb-3 lg:mb-4">
                <h2 className="text-2xl lg:text-3xl font-serif text-slate-200 tracking-widest mb-2 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 lg:w-8 lg:h-8 mr-2 lg:mr-3 text-red-500" /> 城中医馆
                </h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                    豪杰在外征战难免负伤，在此可救治伤兵、恢复血气。
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between mb-3 lg:mb-4 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-1.5 lg:px-4 lg:py-2">
                <div className="flex items-center gap-2 lg:gap-3">
                    <span className="text-[11px] font-mono text-slate-500">Lv.{hospLvl}</span>
                    <span className="text-[10px] text-red-300/80">{currentBenefit.label}</span>
                    {discount > 0 && (
                        <span className="text-[10px] bg-red-500/15 text-red-300 px-1.5 py-0.5 rounded font-mono">-{discount}%费用</span>
                    )}
                </div>
                {nextBenefit && (
                    <button
                        onClick={() => upgradeBuilding('hospitalLevel', upgradeCost)}
                        disabled={!canUpgrade}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono transition-all",
                            canUpgrade ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/25" : "text-slate-600 cursor-not-allowed"
                        )}
                    >
                        <ArrowUpCircle className="w-3 h-3" />
                        升级 → {nextBenefit.label.split('，')[0]}
                    </button>
                )}
            </div>

            {totalWounded > 0 && (
                <div className="mb-3 lg:mb-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 lg:p-3 flex items-center gap-2 lg:gap-3">
                    <Bandage className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400 shrink-0" />
                    <div className="text-[13px] lg:text-sm text-orange-200">
                        全营共有 <span className="font-bold font-mono text-orange-300">{totalWounded}</span> 名伤兵待救治
                        <span className="text-orange-400/60 text-[11px] lg:text-xs ml-1.5 lg:ml-2">（不救治也会缓慢自愈）</span>
                    </div>
                    {heroes.length > 0 && (
                        <button
                            onClick={() => healParty(0.2)}
                            className="ml-auto text-[11px] bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/25 transition-all font-bold tracking-wider"
                        >
                            <Sparkles className="w-3 h-3 inline mr-1" />全员疗养
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {heroes.map(hero => {
                    const t = HERO_TEMPLATES[hero.templateId];
                    const maxHp = t.attributes.physique * 10;
                    const missingHp = maxHp - hero.hp;
                    const baseHealCost = missingHp * 2;
                    const actualHealCost = Math.max(0, Math.floor(baseHealCost * (1 - discount / 100)));
                    const canHeal = resources.food >= actualHealCost && missingHp > 0;

                    const baseTreatCost = Math.ceil((hero.wounded || 0) * TREAT_COST_PER_WOUNDED);
                    const actualTreatCost = Math.max(0, Math.floor(baseTreatCost * (1 - discount / 100)));
                    const canTreat = resources.food >= actualTreatCost && (hero.wounded || 0) > 0;

                    return (
                        <div key={hero.id} className="bg-black/40 border border-white/10 rounded-xl p-3 lg:p-5 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none"></div>

                            <div className="flex items-center space-x-2 lg:space-x-3 mb-2.5 lg:mb-3 relative z-10">
                                <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-lg bg-white/5 flex items-center justify-center font-serif text-lg lg:text-xl font-bold border border-white/10 text-slate-300 shrink-0 overflow-hidden">
                                    <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-200 truncate">{t.name} <span className="text-xs font-mono text-emerald-400 ml-1.5">Lv{hero.level}</span></div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
                                        <span>统帅 {t.attributes.command}</span>
                                        <span className="text-white/10">|</span>
                                        <span>兵卒 {hero.troops}</span>
                                        {(hero.wounded || 0) > 0 && (
                                            <>
                                                <span className="text-white/10">|</span>
                                                <span className="text-orange-400">伤兵 {hero.wounded}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* HP Bar */}
                            <div className="mb-2.5 lg:mb-3 relative z-10">
                                <div className="flex justify-between text-[10px] font-mono mb-1">
                                    <span className={cn(hero.hp < maxHp * 0.3 ? "text-red-400" : "text-slate-400")}>
                                        血气 {hero.hp}/{maxHp}
                                    </span>
                                    {missingHp > 0 && <span className="text-red-400">-{missingHp}</span>}
                                </div>
                                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={cn("h-full transition-all duration-500", hero.hp < maxHp * 0.3 ? "bg-red-500" : "bg-emerald-500")}
                                        style={{ width: `${(hero.hp / maxHp) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Wounded Bar */}
                            {(hero.wounded || 0) > 0 && (
                                <div className="mb-2.5 lg:mb-3 relative z-10">
                                    <div className="flex justify-between text-[10px] font-mono mb-1">
                                        <span className="text-orange-400">伤兵 {hero.wounded}</span>
                                        <span className="text-slate-600">可救治为健卒</span>
                                    </div>
                                    <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-orange-500/70 rounded-full transition-all duration-500"
                                             style={{ width: `${Math.min(100, (hero.wounded / Math.max(1, hero.troops + hero.wounded)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-auto relative z-10 flex gap-1.5 lg:gap-2">
                                {(hero.wounded || 0) > 0 ? (
                                    <button
                                        onClick={() => treatWounded(hero.id, hero.wounded, baseTreatCost)}
                                        disabled={!canTreat}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg font-bold tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all",
                                            canTreat
                                                ? "bg-orange-900/30 hover:bg-orange-800/50 border border-orange-500/40 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                                                : "bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed"
                                        )}
                                    >
                                        <Bandage className="w-3.5 h-3.5" />
                                        救治
                                        <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono">
                                            {actualTreatCost}{discount > 0 && <span className="text-emerald-400 line-through ml-1">{baseTreatCost}</span>}粮
                                        </span>
                                    </button>
                                ) : (
                                    <div className="flex-1 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-600 text-xs font-bold tracking-wider text-center">
                                        无伤兵
                                    </div>
                                )}

                                {missingHp > 0 ? (
                                    <button
                                        onClick={() => healHero(hero.id, missingHp, baseHealCost)}
                                        disabled={!canHeal}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg font-bold tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all",
                                            canHeal
                                                ? "bg-red-900/30 hover:bg-red-800/50 border border-red-500/40 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                                                : "bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed"
                                        )}
                                    >
                                        <Cross className="w-3.5 h-3.5" />
                                        治伤
                                        <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono">
                                            {actualHealCost}{discount > 0 && <span className="text-emerald-400 line-through ml-1">{baseHealCost}</span>}粮
                                        </span>
                                    </button>
                                ) : (
                                    <div className="flex-1 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-600 text-xs font-bold tracking-wider text-center">
                                        气足
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {heroes.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-slate-600 italic">暂无门客</div>
            )}
        </div>
    );
}
