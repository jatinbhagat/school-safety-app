'use client';

import { useRouter } from 'next/navigation';
import { DEMO_DATA } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function SafetyScoreDemoPage() {
  const router = useRouter();
  const scoreData = DEMO_DATA.safetyScore;

  // Prepare data for component breakdown chart
  const componentData = scoreData.components.map((comp) => ({
    name: comp.name,
    score: comp.score,
    weight: comp.weight * 100,
  }));

  // Mock historical data for trend
  const trendData = [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 66 },
    { month: 'Mar', score: 68 },
    { month: 'Apr', score: 69 },
    { month: 'May', score: 70 },
    { month: 'Jun', score: 72 },
  ];

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div style={styles.container}>
      <DemoBanner />

      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => router.push('/admin/demo')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>📊</span>
          Safety Score Dashboard
        </h1>
        <p style={styles.subtitle}>
          Comprehensive safety metrics and performance tracking
        </p>
      </header>

      {/* Overall Score Card */}
      <div style={styles.scoreCard}>
        <div style={styles.scoreMainSection}>
          <div style={styles.scoreLabel}>Overall Safety Score</div>
          <div
            style={{
              ...styles.scoreValue,
              color: getScoreColor(scoreData.overall),
            }}
          >
            {scoreData.overall}
            <span style={styles.scoreGrade}>
              {getScoreGrade(scoreData.overall)}
            </span>
          </div>
          <div style={styles.scoreTrend}>
            <span
              style={{
                ...styles.trendIndicator,
                color: scoreData.trend === 'improving' ? '#10B981' : '#EF4444',
              }}
            >
              {scoreData.trend === 'improving' ? '↗' : '↘'}
            </span>
            <span style={styles.trendText}>
              {scoreData.trend === 'improving'
                ? `+${scoreData.overall - scoreData.previousScore} from last month`
                : `${scoreData.overall - scoreData.previousScore} from last month`}
            </span>
          </div>
        </div>

        <div style={styles.scoreInfoSection}>
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>Previous Score</div>
            <div style={styles.infoValue}>{scoreData.previousScore}</div>
          </div>
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>Trend</div>
            <div
              style={{
                ...styles.infoValue,
                color: scoreData.trend === 'improving' ? '#10B981' : '#EF4444',
              }}
            >
              {scoreData.trend === 'improving' ? 'Improving' : 'Declining'}
            </div>
          </div>
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>Grade</div>
            <div style={styles.infoValue}>
              {getScoreGrade(scoreData.overall)}
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div style={styles.chartCard}>
        <h2 style={styles.chartTitle}>Component Breakdown</h2>
        <p style={styles.chartDescription}>
          Individual scores for each safety metric component
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={componentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#8B5CF6" name="Score" />
          </BarChart>
        </ResponsiveContainer>

        {/* Component Details */}
        <div style={styles.componentsList}>
          {scoreData.components.map((comp, index) => (
            <div key={index} style={styles.componentItem}>
              <div style={styles.componentHeader}>
                <span style={styles.componentName}>{comp.name}</span>
                <span
                  style={{
                    ...styles.componentScore,
                    color: getScoreColor(comp.score),
                  }}
                >
                  {comp.score}/100
                </span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${comp.score}%`,
                    backgroundColor: getScoreColor(comp.score),
                  }}
                />
              </div>
              <div style={styles.componentWeight}>
                Weight: {(comp.weight * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      <div style={styles.chartCard}>
        <h2 style={styles.chartTitle}>6-Month Trend</h2>
        <p style={styles.chartDescription}>
          Historical safety score performance over time
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8B5CF6"
              strokeWidth={3}
              name="Safety Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div style={styles.recommendationsCard}>
        <h3 style={styles.recommendationsTitle}>🎯 Recommendations</h3>
        <div style={styles.recommendationsList}>
          <div style={styles.recommendationItem}>
            <div style={styles.recommendationPriority}>HIGH</div>
            <div style={styles.recommendationContent}>
              <strong>Improve Student Engagement</strong>
              <p>
                Current score: 60/100. Implement peer ambassador program and
                increase awareness campaigns.
              </p>
            </div>
          </div>
          <div style={styles.recommendationItem}>
            <div
              style={{
                ...styles.recommendationPriority,
                backgroundColor: '#F59E0B',
              }}
            >
              MEDIUM
            </div>
            <div style={styles.recommendationContent}>
              <strong>Enhance Prevention Programs</strong>
              <p>
                Current score: 65/100. Add monthly workshops and update training
                materials.
              </p>
            </div>
          </div>
          <div style={styles.recommendationItem}>
            <div
              style={{
                ...styles.recommendationPriority,
                backgroundColor: '#10B981',
              }}
            >
              LOW
            </div>
            <div style={styles.recommendationContent}>
              <strong>Maintain Response Time Excellence</strong>
              <p>
                Current score: 85/100. Continue current protocols and monitor
                performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  backButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  titleIcon: {
    fontSize: '2rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: 0,
  } as React.CSSProperties,
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  scoreMainSection: {
    flex: '2',
    minWidth: '250px',
  } as React.CSSProperties,
  scoreLabel: {
    fontSize: '1rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  scoreValue: {
    fontSize: '5rem',
    fontWeight: 'bold',
    lineHeight: 1,
    marginBottom: '1rem',
  } as React.CSSProperties,
  scoreGrade: {
    fontSize: '3rem',
    marginLeft: '1rem',
    opacity: 0.7,
  } as React.CSSProperties,
  scoreTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  trendIndicator: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  trendText: {
    fontSize: '0.875rem',
    color: '#6B7280',
  } as React.CSSProperties,
  scoreInfoSection: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    minWidth: '200px',
  } as React.CSSProperties,
  infoBox: {
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  infoLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  infoValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
  } as React.CSSProperties,
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  chartTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  chartDescription: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: '0 0 1.5rem 0',
  } as React.CSSProperties,
  componentsList: {
    marginTop: '2rem',
    display: 'grid',
    gap: '1rem',
  } as React.CSSProperties,
  componentItem: {
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  componentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  componentName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  } as React.CSSProperties,
  componentScore: {
    fontSize: '1rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  progressBar: {
    height: '0.5rem',
    backgroundColor: '#E5E7EB',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    transition: 'width 0.3s',
  } as React.CSSProperties,
  componentWeight: {
    fontSize: '0.75rem',
    color: '#6B7280',
  } as React.CSSProperties,
  recommendationsCard: {
    backgroundColor: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  } as React.CSSProperties,
  recommendationsTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#92400E',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  recommendationsList: {
    display: 'grid',
    gap: '1rem',
  } as React.CSSProperties,
  recommendationItem: {
    display: 'flex',
    gap: '1rem',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  recommendationPriority: {
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    height: 'fit-content',
  } as React.CSSProperties,
  recommendationContent: {
    flex: 1,
  } as React.CSSProperties,
};
