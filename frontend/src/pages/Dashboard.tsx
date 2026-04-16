import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, Contract } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineUpload,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, contractsRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/contracts?limit=10'),
      ]);
      setStats(statsRes.data);
      setContracts(contractsRes.data.contracts);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('limit', '10');

      const { data } = await axios.get(`/api/contracts?${params.toString()}`);
      setContracts(data.contracts);
    } catch {
      toast.error('Search failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;
    try {
      await axios.delete(`/api/contracts/${id}`);
      toast.success('Contract deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete contract');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityBadge = (severity: string) => {
    const classes: Record<string, string> = {
      critical: 'severity-badge-critical',
      high: 'severity-badge-high',
      medium: 'severity-badge-medium',
      low: 'severity-badge-low',
    };
    return classes[severity] || classes.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Chart data
  const pieData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: stats
          ? [
              stats.severityDistribution.critical,
              stats.severityDistribution.high,
              stats.severityDistribution.medium,
              stats.severityDistribution.low,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          'rgba(220, 38, 38, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(220, 38, 38, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ['Legal', 'Financial', 'Compliance', 'Operational'],
    datasets: [
      {
        label: 'Avg Risk Score',
        data: stats
          ? [
              stats.avgCategoryScores.legal,
              stats.avgCategoryScores.financial,
              stats.avgCategoryScores.compliance,
              stats.avgCategoryScores.operational,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(168, 85, 247, 0.6)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: stats?.dailyData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Contracts Analyzed',
        data: stats?.dailyData.map((d) => d.count) || [],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter' },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter' },
          padding: 16,
        },
      },
    },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="glass-card p-6 sm:p-8 mb-8 bg-gradient-to-r from-slate-800/80 to-slate-800/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-400 mt-1">
                Here&apos;s your contract analysis overview
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Contracts */}
          <div className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <HiOutlineDocumentText className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-mono text-gray-500">TOTAL</span>
            </div>
            <p className="text-3xl font-bold text-gray-100">{stats?.totalContracts || 0}</p>
            <p className="text-gray-400 text-sm mt-1">Contracts Analyzed</p>
          </div>

          {/* Average Score */}
          <div className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <HiOutlineShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs font-mono text-gray-500">AVG</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(stats?.avgScore || 0)}`}>
              {stats?.avgScore || 0}
              <span className="text-lg text-gray-500">/100</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Average Risk Score</p>
          </div>

          {/* High/Critical Risks */}
          <div className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <HiOutlineExclamation className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-xs font-mono text-gray-500">ALERT</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{stats?.highCriticalCount || 0}</p>
            <p className="text-gray-400 text-sm mt-1">High/Critical Risks</p>
          </div>

          {/* Growth */}
          <div className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <HiOutlineTrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-xs font-mono text-gray-500">TREND</span>
            </div>
            <p className="text-3xl font-bold text-indigo-400">
              {(stats?.growthPercentage || 0) >= 0 ? '↑' : '↓'}{' '}
              {Math.abs(stats?.growthPercentage || 0)}%
            </p>
            <p className="text-gray-400 text-sm mt-1">Growth Trend (7d)</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Pie Chart */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Risk Severity Distribution</h3>
            <div className="h-64">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Avg Score by Category</h3>
            <div className="h-64">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          {/* Line Chart */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Contracts (Last 7 Days)</h3>
            <div className="h-64">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mb-8">
          <Link to="/analyzer" className="btn-primary inline-flex items-center gap-3 text-lg px-10 py-4">
            <HiOutlineUpload className="w-6 h-6" />
            Analyze New Contract
          </Link>
        </div>

        {/* Contract History */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-100">Recent Contracts</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search contracts..."
                  className="input-field pl-10 py-2 text-sm"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setTimeout(handleSearch, 0);
                }}
                className="input-field py-2 text-sm"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineDocumentText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No contracts analyzed yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Upload a contract to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                      Filename
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium hidden sm:table-cell">
                      Risks
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr
                      key={contract._id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-gray-200 text-sm font-medium truncate max-w-[200px]">
                          {contract.filename}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-sm font-bold ${getScoreColor(contract.analysis?.score || 0)}`}
                        >
                          {contract.analysis?.score || 0}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {contract.analysis?.risks?.slice(0, 3).map((risk, i) => (
                            <span key={i} className={getSeverityBadge(risk.severity)}>
                              {risk.severity}
                            </span>
                          ))}
                          {(contract.analysis?.risks?.length || 0) > 3 && (
                            <span className="text-gray-500 text-xs self-center">
                              +{(contract.analysis?.risks?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm hidden md:table-cell">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(contract._id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
