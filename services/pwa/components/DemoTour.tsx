'use client';

import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface DemoTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2>Welcome to the School Safety App Demo!</h2>
        <p>
          This interactive tour will guide you through all the key features of our
          comprehensive safety reporting system.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="demo-tiles"]',
    content: (
      <div>
        <h3>Demo Command Center</h3>
        <p>
          Each tile represents a different feature of the system. Click any tile
          to explore that specific feature in detail.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="kiosk-tile"]',
    content: (
      <div>
        <h3>Kiosk Walkthrough</h3>
        <p>
          The student-facing kiosk allows anonymous reporting with offline
          capabilities. Students can report incidents even without internet
          connectivity.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="triage-tile"]',
    content: (
      <div>
        <h3>AI-Powered Triage</h3>
        <p>
          Our AI system analyzes incidents and provides intelligent routing
          suggestions, helping staff respond faster and more effectively.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="staff-response-tile"]',
    content: (
      <div>
        <h3>Staff Incident Response</h3>
        <p>
          See how school counselors, administrators, and staff receive, manage,
          and resolve student-reported incidents. Watch the complete workflow
          from assignment to resolution.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="heatmap-tile"]',
    content: (
      <div>
        <h3>Heatmap & Trends</h3>
        <p>
          Visualize incident patterns across your school. Identify hotspots and
          trends to implement targeted prevention programs.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="safety-score-tile"]',
    content: (
      <div>
        <h3>Safety Score Dashboard</h3>
        <p>
          Track your school's overall safety metrics with component breakdowns.
          Monitor progress and identify areas for improvement.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="run-demo"]',
    content: (
      <div>
        <h3>One-Click Full Demo</h3>
        <p>
          Click here to run a complete demonstration that walks through the entire
          workflow from student report to admin response.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>Ready to Explore!</h2>
        <p>
          You're all set! Feel free to explore any feature. Remember, all demo
          data is isolated and won't affect production.
        </p>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
          💡 Tip: You can restart this tour anytime from the Full Guided Tour tile.
        </p>
      </div>
    ),
    placement: 'center',
  },
];

export default function DemoTour({ autoStart = false, onComplete }: DemoTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour should auto-start
    if (autoStart) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setRun(true);
      }, 500);
    }
  }, [autoStart]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    console.log('Joyride callback:', { action, index, status, type });

    // Handle tour completion and stopping first
    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      setStepIndex(0);

      // Mark tour as completed in localStorage only if finished
      if (status === 'finished' && typeof window !== 'undefined') {
        try {
          localStorage.setItem('demo_tour_completed', 'true');
        } catch (error) {
          console.error('Error saving tour completion:', error);
        }
      }

      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Handle close action
    if (action === 'close') {
      setRun(false);
      setStepIndex(0);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Update step index only after a step transition has completed
    // This prevents multiple updates during a single step transition
    // The callback fires multiple times per step with different 'type' values,
    // so we only update when type is 'step:after' to ensure one update per transition
    if (type === 'step:after') {
      if (action === 'next' && index < TOUR_STEPS.length - 1) {
        setStepIndex(index + 1);
      } else if (action === 'prev' && index > 0) {
        setStepIndex(index - 1);
      }
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#8B5CF6',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '0.75rem',
          fontSize: '1rem',
        },
        tooltipContent: {
          padding: '1rem',
        },
        buttonNext: {
          backgroundColor: '#8B5CF6',
          fontSize: '0.875rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
        },
        buttonBack: {
          color: '#6B7280',
          fontSize: '0.875rem',
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: '0.875rem',
        },
      }}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
}
