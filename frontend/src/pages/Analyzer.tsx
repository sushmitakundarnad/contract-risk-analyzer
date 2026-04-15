import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Analysis } from '../types';
import RiskCard from '../components/RiskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineUpload,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineDownload,
  HiOutlineRefresh,
} from 'react-icons/hi';

export default function Analyzer() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filename, setFilename] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setFilename(f.name);
      setText('');
      toast.success(`File "${f.name}" selected`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file && !text.trim()) {
      toast.error('Please upload a file or paste contract text');
      return;
    }

    if (!file && text.trim().length < 50) {
      toast.error('Please provide at least 50 characters of contract text');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await axios.post('/api/contracts/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axios.post('/api/contracts/analyze', {
          text: text.trim(),
          filename: 'Pasted Text',
        });
      }

      setAnalysis(response.data.analysis);
      setFilename(response.data.filename);
      toast.success('Analysis complete!');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Analysis failed. Please try again.');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setText('');
    setAnalysis(null);
    setFilename('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Moderate Risk';
    if (score >= 40) return 'High Risk';
    return 'Critical Risk';
  };

  const exportPDF = () => {
    if (!analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('Contract Risk Analysis Report', pageWidth / 2, 20, { align: 'center' });

    // Filename and date
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`File: ${filename || 'Contract'}`, 14, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Overall Score: ${analysis.score}/100 - ${getScoreLabel(analysis.score)}`, 14, 49);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', 14, 62);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(analysis.summary, pageWidth - 28);
    doc.text(summaryLines, 14, 70);

    // Risks table
    const startY = 70 + summaryLines.length * 5 + 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Identified Risks', 14, startY);

    const tableData = analysis.risks.map((risk) => [
      risk.title,
      risk.severity.toUpperCase(),
      risk.category,
      risk.description.substring(0, 80) + (risk.description.length > 80 ? '...' : ''),
      risk.mitigation.substring(0, 80) + (risk.mitigation.length > 80 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Risk', 'Severity', 'Category', 'Description', 'Mitigation']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 50 },
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
    });

    doc.save(`risk-report-${filename || 'contract'}.pdf`);
    toast.success('PDF report exported!');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">
            Contract Risk Analyzer
          </h1>
          <p className="text-gray-400 text-lg">
            Upload a contract or paste text to identify potential risks with AI
          </p>
        </div>

        {!analysis ? (
          <>
            {/* Upload Zone */}
            <div className="glass-card p-8 mb-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <HiOutlineUpload className="w-6 h-6 text-blue-400" />
                Upload Contract File
              </h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : file
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-slate-600/50 hover:border-blue-500/50 hover:bg-slate-800/30'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                      <HiOutlineDocumentText className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold">{file.name}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {(file.size / 1024).toFixed(1)} KB - Click or drag to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <HiOutlineUpload className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 font-medium">
                        {isDragActive
                          ? 'Drop file here...'
                          : 'Drag & drop a contract file here'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        or click to browse (PDF, TXT, DOC - Max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-gray-500 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>

            {/* Text Paste Area */}
            <div className="glass-card p-8 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <HiOutlineDocumentText className="w-6 h-6 text-blue-400" />
                Paste Contract Text
              </h2>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setFile(null);
                }}
                placeholder="Paste your contract text here for AI-powered risk analysis...

Example: This Agreement is entered into between Party A ('Client') and Party B ('Service Provider'). The Service Provider agrees to provide consulting services for a period of 12 months. The Client shall pay a monthly retainer of $5,000. Either party may terminate this agreement with 30 days written notice..."
                className="input-field h-48 resize-y font-mono text-sm"
              />
              <p className="text-gray-500 text-xs mt-2">
                Minimum 50 characters required. Maximum 15,000 characters will be analyzed.
              </p>
            </div>

            {/* Analyze Button */}
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!file && !text.trim())}
                className="btn-primary inline-flex items-center gap-3 text-lg px-10 py-4"
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineShieldCheck className="w-6 h-6" />
                    Analyze Risks
                  </>
                )}
              </button>
            </div>

            {/* Loading Animation */}
            {isAnalyzing && (
              <div className="mt-8 glass-card p-8 animate-fade-in">
                <div className="space-y-4">
                  <div className="skeleton h-8 w-3/4" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-5/6" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="skeleton h-32 rounded-xl" />
                    <div className="skeleton h-32 rounded-xl" />
                  </div>
                  <div className="skeleton h-32 rounded-xl" />
                </div>
                <p className="text-gray-400 text-center mt-6 animate-pulse">
                  AI is analyzing your contract for potential risks...
                </p>
              </div>
            )}
          </>
        ) : (
          /* Results */
          <div className="space-y-6 animate-fade-in">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={handleReset} className="btn-secondary inline-flex items-center gap-2">
                <HiOutlineRefresh className="w-4 h-4" />
                Analyze Another
              </button>
              <button onClick={exportPDF} className="btn-secondary inline-flex items-center gap-2">
                <HiOutlineDownload className="w-4 h-4" />
                Export PDF Report
              </button>
            </div>

            {/* Score Badge */}
            <div className="glass-card p-8 text-center">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-3">
                Overall Risk Score
              </p>
              <div className="inline-flex items-center gap-4">
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreColor(analysis.score)} flex items-center justify-center shadow-2xl`}
                >
                  <span className="text-3xl font-bold text-white">{analysis.score}</span>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-100">
                    {getScoreLabel(analysis.score)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {analysis.risks.length} risk{analysis.risks.length !== 1 ? 's' : ''} identified
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Executive Summary</h3>
              <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Risk Category Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(analysis.riskCategories).map(([category, count]) => (
                <div key={category} className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-gray-100">{count}</p>
                  <p className="text-gray-400 text-sm capitalize">{category}</p>
                </div>
              ))}
            </div>

            {/* Risk Cards */}
            <div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                Identified Risks ({analysis.risks.length})
              </h3>
              <div className="space-y-4">
                {analysis.risks.map((risk, index) => (
                  <RiskCard key={index} risk={risk} index={index} />
                ))}
              </div>
            </div>

            {analysis.risks.length === 0 && (
              <div className="glass-card p-8 text-center">
                <HiOutlineShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-100">No Major Risks Found</h3>
                <p className="text-gray-400 mt-2">
                  The contract appears to be well-structured with no significant risk factors.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
