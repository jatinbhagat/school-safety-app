'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_DATA } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';

export default function TriageDemoPage() {
  const router = useRouter();
  const [selectedIncident, setSelectedIncident] = useState(DEMO_DATA.incidents[0]);
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false);

  const routingSuggestion = DEMO_DATA.triageRouting.suggestion;

  const handleConfirmAssignment = () => {
    setAssignmentConfirmed(true);
    setShowRoutingModal(false);

    // Simulate adding timeline note
    setTimeout(() => {
      alert(
        '✅ Assignment Confirmed!\n\n' +
          `Incident assigned to: ${routingSuggestion.role}\n` +
          'Timeline updated with assignment note.\n' +
          'Notification sent to assigned staff member.'
      );
    }, 500);
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
          <span style={styles.titleIcon}>🎯</span>
          Incident Triage & Routing Demo
        </h1>
        <p style={styles.subtitle}>
          AI-powered intelligent routing and assignment recommendations
        </p>
      </header>

      {/* Main Content Grid */}
      <div style={styles.mainGrid}>
        {/* Incident List */}
        <div style={styles.incidentListCard}>
          <h2 style={styles.cardTitle}>Recent Incidents</h2>
          <div style={styles.incidentList}>
            {DEMO_DATA.incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  ...styles.incidentItem,
                  backgroundColor:
                    selectedIncident.id === incident.id ? '#F3F4F6' : 'white',
                }}
                onClick={() => setSelectedIncident(incident)}
              >
                <div style={styles.incidentHeader}>
                  <span style={styles.incidentCategory}>{incident.category}</span>
                  <span
                    style={{
                      ...styles.severityBadge,
                      backgroundColor:
                        incident.severity === 'high' ? '#FEE2E2' : '#FEF3C7',
                      color: incident.severity === 'high' ? '#991B1B' : '#92400E',
                    }}
                  >
                    {incident.severity}
                  </span>
                </div>
                <div style={styles.incidentDescription}>
                  {incident.description}
                </div>
                <div style={styles.incidentMeta}>
                  <span>{incident.location}</span>
                  <span>·</span>
                  <span>{new Date(incident.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Details & Routing */}
        <div style={styles.detailsSection}>
          {/* Incident Details */}
          <div style={styles.detailsCard}>
            <h2 style={styles.cardTitle}>Incident Details</h2>
            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>ID</div>
                <div style={styles.detailValue}>{selectedIncident.id}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Category</div>
                <div style={styles.detailValue}>{selectedIncident.category}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Severity</div>
                <div
                  style={{
                    ...styles.detailValue,
                    color: selectedIncident.severity === 'high' ? '#DC2626' : '#F59E0B',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedIncident.severity.toUpperCase()}
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Location</div>
                <div style={styles.detailValue}>{selectedIncident.location}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Status</div>
                <div style={styles.detailValue}>{selectedIncident.status}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Reported</div>
                <div style={styles.detailValue}>
                  {new Date(selectedIncident.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={styles.descriptionSection}>
              <div style={styles.detailLabel}>Description</div>
              <div style={styles.descriptionText}>
                {selectedIncident.description}
              </div>
            </div>
          </div>

          {/* AI Routing Suggestion */}
          <div style={styles.routingCard}>
            <div style={styles.routingHeader}>
              <h2 style={styles.cardTitle}>
                🤖 AI Routing Suggestion
              </h2>
              <div style={styles.confidenceBadge}>
                {Math.round(routingSuggestion.confidence * 100)}% Confidence
              </div>
            </div>

            <div style={styles.primarySuggestion}>
              <div style={styles.suggestionRole}>
                Recommended: <strong>{routingSuggestion.role}</strong>
              </div>
              <div style={styles.suggestionRationale}>
                {routingSuggestion.rationale}
              </div>
            </div>

            <div style={styles.alternativeSuggestions}>
              <div style={styles.alternativeTitle}>Alternative Options:</div>
              {routingSuggestion.alternativeRoles.map((alt, index) => (
                <div key={index} style={styles.alternativeItem}>
                  <span style={styles.alternativeRole}>{alt.role}</span>
                  <span style={styles.alternativeConfidence}>
                    {Math.round(alt.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.routingActions}>
              <button
                onClick={() => setShowRoutingModal(true)}
                style={styles.confirmButton}
                disabled={assignmentConfirmed}
              >
                {assignmentConfirmed ? '✓ Assigned' : 'Confirm Assignment'}
              </button>
              <button style={styles.manualButton}>
                Manual Assignment
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div style={styles.timelineCard}>
            <h2 style={styles.cardTitle}>Incident Timeline</h2>
            <div style={styles.timeline}>
              <div style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div style={styles.timelineContent}>
                  <div style={styles.timelineTitle}>Incident Reported</div>
                  <div style={styles.timelineTime}>
                    {new Date(selectedIncident.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div style={styles.timelineContent}>
                  <div style={styles.timelineTitle}>AI Triage Completed</div>
                  <div style={styles.timelineTime}>
                    {new Date(selectedIncident.timestamp + 5000).toLocaleString()}
                  </div>
                  <div style={styles.timelineDetail}>
                    Routing suggestion generated with {Math.round(routingSuggestion.confidence * 100)}% confidence
                  </div>
                </div>
              </div>
              {assignmentConfirmed && (
                <div style={styles.timelineItem}>
                  <div
                    style={{ ...styles.timelineDot, backgroundColor: '#10B981' }}
                  />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineTitle}>Assigned to {routingSuggestion.role}</div>
                    <div style={styles.timelineTime}>
                      {new Date().toLocaleString()}
                    </div>
                    <div style={styles.timelineDetail}>
                      Notification sent to assigned staff member
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Routing Confirmation Modal */}
      {showRoutingModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRoutingModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Assignment</h2>
            <p style={styles.modalText}>
              Assign this incident to <strong>{routingSuggestion.role}</strong>?
            </p>
            <div style={styles.modalDetails}>
              <div style={styles.modalDetailItem}>
                <strong>Incident:</strong> {selectedIncident.description}
              </div>
              <div style={styles.modalDetailItem}>
                <strong>Confidence:</strong> {Math.round(routingSuggestion.confidence * 100)}%
              </div>
              <div style={styles.modalDetailItem}>
                <strong>Rationale:</strong> {routingSuggestion.rationale}
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowRoutingModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button onClick={handleConfirmAssignment} style={styles.confirmModalButton}>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '1.5rem',
  } as React.CSSProperties,
  incidentListCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  incidentList: {
    display: 'grid',
    gap: '0.75rem',
  } as React.CSSProperties,
  incidentItem: {
    padding: '1rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  incidentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  incidentCategory: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  severityBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
  } as React.CSSProperties,
  incidentDescription: {
    fontSize: '0.875rem',
    color: '#111827',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  incidentMeta: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  detailsSection: {
    display: 'grid',
    gap: '1.5rem',
  } as React.CSSProperties,
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  detailItem: {} as React.CSSProperties,
  detailLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
    fontWeight: '600',
  } as React.CSSProperties,
  detailValue: {
    fontSize: '1rem',
    color: '#111827',
  } as React.CSSProperties,
  descriptionSection: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '1rem',
  } as React.CSSProperties,
  descriptionText: {
    fontSize: '1rem',
    color: '#374151',
    lineHeight: '1.5',
  } as React.CSSProperties,
  routingCard: {
    backgroundColor: '#F0F9FF',
    border: '2px solid #3B82F6',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  } as React.CSSProperties,
  routingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  } as React.CSSProperties,
  confidenceBadge: {
    backgroundColor: '#3B82F6',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  primarySuggestion: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  suggestionRole: {
    fontSize: '1.125rem',
    color: '#1E40AF',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  suggestionRationale: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5',
  } as React.CSSProperties,
  alternativeSuggestions: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  alternativeTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  alternativeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderTop: '1px solid #F3F4F6',
  } as React.CSSProperties,
  alternativeRole: {
    fontSize: '0.875rem',
    color: '#374151',
  } as React.CSSProperties,
  alternativeConfidence: {
    fontSize: '0.875rem',
    color: '#6B7280',
  } as React.CSSProperties,
  routingActions: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  confirmButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  manualButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  timeline: {
    display: 'grid',
    gap: '1rem',
  } as React.CSSProperties,
  timelineItem: {
    display: 'flex',
    gap: '1rem',
  } as React.CSSProperties,
  timelineDot: {
    width: '0.75rem',
    height: '0.75rem',
    backgroundColor: '#3B82F6',
    borderRadius: '50%',
    marginTop: '0.25rem',
    flexShrink: 0,
  } as React.CSSProperties,
  timelineContent: {
    flex: 1,
  } as React.CSSProperties,
  timelineTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  timelineTime: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  timelineDetail: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    maxWidth: '600px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  modalText: {
    fontSize: '1rem',
    color: '#374151',
    marginBottom: '1rem',
  } as React.CSSProperties,
  modalDetails: {
    backgroundColor: '#F9FAFB',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    display: 'grid',
    gap: '0.5rem',
  } as React.CSSProperties,
  modalDetailItem: {
    fontSize: '0.875rem',
    color: '#374151',
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  cancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  confirmModalButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
};
