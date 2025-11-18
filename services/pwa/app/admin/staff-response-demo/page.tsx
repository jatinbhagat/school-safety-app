'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DemoBanner } from '@/components/DemoBanner';
import { StatsCard } from '@/components/staff-response/StatsCard';
import { IncidentCard } from '@/components/staff-response/IncidentCard';
import Link from 'next/link';

interface Incident {
  id: number | string;
  type: string;
  description?: string;
  location?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'triaged' | 'assigned';
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  assigned_to?: string;
  ai_confidence?: number;
  recommended_role?: string;
}

interface Stats {
  total: number;
  pending: number;
  myQueue: number;
  resolvedToday: number;
  highPriority: number;
}

export default function StaffResponseDemoPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    myQueue: 0,
    resolvedToday: 0,
    highPriority: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Demo data - you can replace this with API call
  const DEMO_INCIDENTS: Incident[] = [
    {
      id: 'demo-inc-001',
      type: 'bullying',
      description: 'Being bullied in cafeteria by a group of students. This has been happening for the past week. They call me names and exclude me from sitting with them.',
      location: 'Cafeteria',
      status: 'open',
      priority: 'high',
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
      assigned_to: 'School Counselor',
      ai_confidence: 0.87,
      recommended_role: 'School Counselor',
    },
    {
      id: 'demo-inc-002',
      type: 'mental_stress',
      description: 'Feeling overwhelmed with academic pressure and upcoming exams',
      location: 'Classroom Block',
      status: 'in_progress',
      priority: 'medium',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      assigned_to: 'School Counselor',
      ai_confidence: 0.75,
      recommended_role: 'School Counselor',
    },
    {
      id: 'demo-inc-003',
      type: 'cyberbullying',
      description: 'Online harassment on social media. Receiving threatening messages.',
      location: 'Online',
      status: 'in_progress',
      priority: 'high',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      assigned_to: 'Administrator',
      ai_confidence: 0.92,
      recommended_role: 'Administrator',
    },
    {
      id: 'demo-inc-004',
      type: 'harassment',
      description: 'Verbal harassment in hallway between classes',
      location: 'Hallway A',
      status: 'open',
      priority: 'medium',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      ai_confidence: 0.78,
      recommended_role: 'Teacher',
    },
    {
      id: 'demo-inc-005',
      type: 'physical',
      description: 'Physical altercation in the gym during PE class',
      location: 'Gymnasium',
      status: 'resolved',
      priority: 'high',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      assigned_to: 'Security',
      ai_confidence: 0.95,
      recommended_role: 'Security',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIncidents(DEMO_INCIDENTS);
      calculateStats(DEMO_INCIDENTS);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [incidents, statusFilter, priorityFilter]);

  const calculateStats = (data: Incident[]) => {
    const stats = {
      total: data.length,
      pending: data.filter((i) => i.status === 'open').length,
      myQueue: data.filter((i) => i.status === 'in_progress' && i.assigned_to === 'School Counselor').length,
      resolvedToday: data.filter(
        (i) =>
          i.status === 'resolved' &&
          new Date(i.created_at).toDateString() === new Date().toDateString()
      ).length,
      highPriority: data.filter(
        (i) =>
          (i.priority === 'high' || i.priority === 'critical') &&
          (i.status === 'open' || i.status === 'in_progress')
      ).length,
    };
    setStats(stats);
  };

  const filterIncidents = () => {
    let filtered = [...incidents];

    if (statusFilter !== 'all') {
      if (statusFilter === 'my_queue') {
        filtered = filtered.filter(
          (i) => i.status === 'in_progress' && i.assigned_to === 'School Counselor'
        );
      } else if (statusFilter === 'new') {
        filtered = filtered.filter((i) => i.status === 'open');
      } else if (statusFilter === 'high_priority') {
        filtered = filtered.filter(
          (i) => i.priority === 'high' || i.priority === 'critical'
        );
      } else {
        filtered = filtered.filter((i) => i.status === statusFilter);
      }
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((i) => i.priority === priorityFilter);
    }

    setFilteredIncidents(filtered);
  };

  const handleIncidentClick = (incidentId: number | string) => {
    router.push(`/admin/staff-response-demo/incident/${incidentId}?demo=true`);
  };

  const handleAccept = (incidentId: number | string) => {
    // Simulate accepting incident
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: 'in_progress' as const, assigned_to: 'School Counselor' }
          : inc
      )
    );

    // Show success toast (you can use a toast library)
    alert('Incident accepted! Assignment confirmed.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Staff Incident Response Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and respond to student safety incidents
              </p>
            </div>
            <Link
              href="/admin/demo?demo=true"
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
            >
              ← Back to Demo Hub
            </Link>
          </div>

          {/* Staff Profile (Minimal) */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
              JS
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Jane Smith</p>
              <p className="text-xs text-gray-500">School Counselor</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="My Queue"
            value={stats.myQueue}
            icon="📋"
            color="purple"
            subtitle="Assigned to me"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon="⏱️"
            color="orange"
            subtitle="Awaiting assignment"
          />
          <StatsCard
            title="High Priority"
            value={stats.highPriority}
            icon="🔴"
            color="red"
            subtitle="Needs attention"
          />
          <StatsCard
            title="Resolved Today"
            value={stats.resolvedToday}
            icon="✅"
            color="green"
            subtitle="Completed"
          />
          <StatsCard
            title="Total"
            value={stats.total}
            icon="📊"
            color="blue"
            subtitle="All incidents"
          />
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="my_queue">My Queue</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="high_priority">High Priority</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                Priority:
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredIncidents.length} of {incidents.length} incidents
            </div>
          </div>
        </div>

        {/* Incidents List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No incidents match your filters</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => handleIncidentClick(incident.id)}
                onAccept={() => handleAccept(incident.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
