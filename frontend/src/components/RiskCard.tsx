import {
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineLightBulb,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import type { Risk } from '../types';

interface RiskCardProps {
  risk: Risk;
  index: number;
}

const severityConfig = {
  critical: {
    containerClass: 'risk-critical',
    badgeClass: 'severity-badge-critical',
    icon: '🔴',
    color: 'text-red-400',
  },
  high: {
    containerClass: 'risk-high',
    badgeClass: 'severity-badge-high',
    icon: '🟠',
    color: 'text-orange-400',
  },
  medium: {
    containerClass: 'risk-medium',
    badgeClass: 'severity-badge-medium',
    icon: '🟡',
    color: 'text-yellow-400',
  },
  low: {
    containerClass: 'risk-low',
    badgeClass: 'severity-badge-low',
    icon: '🟢',
    color: 'text-green-400',
  },
};

const categoryIcons = {
  legal: '⚖️',
  financial: '💰',
  compliance: '📋',
  operational: '⚙️',
};

export default function RiskCard({ risk, index }: RiskCardProps) {
  const config = severityConfig[risk.severity];

  return (
    <div
      className={`${config.containerClass} rounded-2xl p-6 animate-slide-up`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{risk.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={config.badgeClass}>{risk.severity}</span>
              <span className="text-gray-500 text-xs">
                {categoryIcons[risk.category]} {risk.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="flex items-start gap-2 text-gray-300">
          <HiOutlineExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500" />
          <p className="text-sm leading-relaxed">{risk.description}</p>
        </div>
      </div>

      {/* Mitigation */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-3">
        <div className="flex items-start gap-2">
          <HiOutlineLightBulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              Recommended Mitigation
            </p>
            <p className="text-sm text-blue-200 leading-relaxed">{risk.mitigation}</p>
          </div>
        </div>
      </div>

      {/* Clause Location */}
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        <HiOutlineLocationMarker className="w-4 h-4" />
        <span>Found in: {risk.clauseLocation}</span>
      </div>

      {/* Shield icon for resolved potential */}
      <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs">
        <HiOutlineShieldCheck className="w-4 h-4" />
        <span>Review recommended before signing</span>
      </div>
    </div>
  );
}
