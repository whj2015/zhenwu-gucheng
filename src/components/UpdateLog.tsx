import { X, Tag, Calendar, Star, Zap, Bug, Sparkles } from 'lucide-react';
import { CHANGELOG, getVersionDisplay } from '../version';

interface UpdateLogProps {
  onClose: () => void;
}

const typeConfig = {
  major: { icon: Star, color: 'text-red-400', bgColor: 'bg-red-500/10', label: '重大更新' },
  minor: { icon: Zap, color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: '功能更新' },
  patch: { icon: Bug, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: '问题修复' }
};

export default function UpdateLog({ onClose }: UpdateLogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0d0f12] border border-white/10 rounded-xl max-w-2xl w-full max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-orange-600/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600/20 border border-orange-500/50 flex items-center justify-center rounded-lg">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-orange-100 tracking-wide font-serif">更新公告</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update Changelog</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Version Badge */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30 rounded-lg">
              <Tag className="w-4 h-4 text-orange-500" />
              <span className="font-mono font-bold text-orange-300">{getVersionDisplay()}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>当前版本</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {CHANGELOG.map((version, index) => {
            const config = typeConfig[version.type];
            const TypeIcon = config.icon;

            return (
              <div
                key={version.version}
                className={`relative ${index !== CHANGELOG.length - 1 ? 'pb-6 border-b border-white/5' : ''}`}
              >
                {/* Version Header */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0">
                        最新
                      </span>
                    )}
                    <div className={`flex items-center gap-2 px-3 py-1.5 ${config.bgColor} border border-current/20 rounded-full`}>
                      <TypeIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <span className="font-mono font-bold text-lg text-slate-200">V{version.version}</span>
                  </div>
                  <span className="text-sm text-slate-500 font-mono shrink-0">{version.date}</span>
                </div>

                {/* Changes List */}
                <ul className="space-y-2.5 ml-2">
                  {version.changes.map((change, changeIndex) => (
                    <li
                      key={changeIndex}
                      className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed group"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500/60 shrink-0 group-hover:bg-orange-400 transition-colors"></span>
                      <span className="group-hover:text-slate-100 transition-colors">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {CHANGELOG.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">暂无更新记录</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
