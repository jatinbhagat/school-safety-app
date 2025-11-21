'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';

interface RoutingRule {
  id: number;
  rule_id: string;
  name: string;
  description: string;
  priority: number;
  is_active: boolean;
  condition_config: {
    keywords?: string[];
    severity_threshold?: number;
  };
  target_role: string;
  routing_priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  estimated_response_time: string;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function RoutingRulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 50,
    keywords: '',
    severityThreshold: null as number | null,
    targetRole: 'staff',
    routingPriority: 'medium',
    confidence: 0.80,
    estimatedResponseTime: '< 2 hours',
  });

  const [filterRole, setFilterRole] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user
      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!meResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await meResponse.json();
      const instId = userData.institution?.id;
      setInstitutionId(instId);
      setInstitutionName(userData.institution?.name || '');
      setUserName(userData.name || '');
      setUserRole(userData.role || '');

      // Fetch routing rules
      const rulesResponse = await fetch(
        `${API_BASE_URL}/api/institutions/${instId}/routing-rules`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!rulesResponse.ok) {
        throw new Error('Failed to fetch routing rules');
      }

      const rulesData = await rulesResponse.json();
      setRules(rulesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule: RoutingRule) => {
    if (!institutionId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE_URL}/api/institutions/${institutionId}/routing-rules/${rule.rule_id}/toggle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle rule');
      }

      setSuccess(`Rule ${rule.is_active ? 'disabled' : 'enabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule');
    }
  };

  const handleEditRule = (rule: RoutingRule) => {
    setEditingRule(rule);
    setIsCreating(false);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      priority: rule.priority,
      keywords: rule.condition_config.keywords?.join(', ') || '',
      severityThreshold: rule.condition_config.severity_threshold || null,
      targetRole: rule.target_role,
      routingPriority: rule.routing_priority,
      confidence: rule.confidence,
      estimatedResponseTime: rule.estimated_response_time || '< 2 hours',
    });
    setShowEditModal(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      priority: 50,
      keywords: '',
      severityThreshold: null,
      targetRole: 'staff',
      routingPriority: 'medium',
      confidence: 0.80,
      estimatedResponseTime: '< 2 hours',
    });
    setShowEditModal(true);
  };

  const handleSaveRule = async () => {
    if (!institutionId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        severityThreshold: formData.severityThreshold,
        targetRole: formData.targetRole,
        routingPriority: formData.routingPriority,
        confidence: formData.confidence,
        estimatedResponseTime: formData.estimatedResponseTime,
      };

      const url = isCreating
        ? `${API_BASE_URL}/api/institutions/${institutionId}/routing-rules`
        : `${API_BASE_URL}/api/institutions/${institutionId}/routing-rules/${editingRule?.rule_id}`;

      const method = isCreating ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save rule');
      }

      setSuccess(isCreating ? 'Rule created successfully' : 'Rule updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (rule: RoutingRule) => {
    if (!institutionId) return;

    // Check if it's a critical rule
    const baseRuleId = rule.rule_id.split('_inst_')[0];
    if (['rule_001', 'rule_002', 'rule_004'].includes(baseRuleId)) {
      setError('Cannot delete critical safety rules. You can disable them instead.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE_URL}/api/institutions/${institutionId}/routing-rules/${rule.rule_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rule');
      }

      setSuccess('Rule deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const filteredRules = rules.filter(rule => {
    if (filterRole !== 'all' && rule.target_role !== filterRole) return false;
    if (filterPriority !== 'all' && rule.routing_priority !== filterPriority) return false;
    if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'security': return 'bg-red-100 text-red-700';
      case 'nurse': return 'bg-pink-100 text-pink-700';
      case 'counselor': return 'bg-purple-100 text-purple-700';
      case 'administrator': return 'bg-blue-100 text-blue-700';
      case 'teacher': return 'bg-green-100 text-green-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'staff': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routing rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        institutionName={institutionName}
        userRole={userRole}
        userName={userName}
      />
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Routing Rules</h1>
              <p className="text-lg text-gray-600">
                Configure how incidents are automatically routed to staff members
              </p>
            </div>
            {userRole === 'super_admin' && (
              <button
                onClick={handleCreateRule}
                className="btn btn-primary"
              >
                + New Rule
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-semibold">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input"
              >
                <option value="all">All Roles</option>
                <option value="security">Security</option>
                <option value="nurse">Nurse</option>
                <option value="counselor">Counselor</option>
                <option value="administrator">Administrator</option>
                <option value="teacher">Teacher</option>
                <option value="maintenance">Maintenance</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            const baseRuleId = rule.rule_id.split('_inst_')[0];
            const isCritical = ['rule_001', 'rule_002', 'rule_004'].includes(baseRuleId);

            return (
              <div
                key={rule.id}
                className={`card hover:shadow-lg transition-shadow ${!rule.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{rule.name}</h3>
                      {isCritical && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          CRITICAL
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityBadgeColor(rule.routing_priority)}`}>
                        {rule.routing_priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(rule.target_role)}`}>
                        {rule.target_role}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rule.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-semibold">Priority:</span> {rule.priority}
                      </div>
                      <div>
                        <span className="font-semibold">Confidence:</span> {(rule.confidence * 100).toFixed(0)}%
                      </div>
                      {rule.estimated_response_time && (
                        <div>
                          <span className="font-semibold">Response Time:</span> {rule.estimated_response_time}
                        </div>
                      )}
                    </div>
                    {rule.condition_config.keywords && rule.condition_config.keywords.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-semibold text-gray-700">Keywords: </span>
                        <span className="text-sm text-gray-600">{rule.condition_config.keywords.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        rule.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </button>
                    {userRole === 'super_admin' && (
                      <>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit rule"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!isCritical && (
                          <button
                            onClick={() => handleDeleteRule(rule)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete rule"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRules.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">No routing rules found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Create New Routing Rule' : 'Edit Routing Rule'}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Behavioral Issues"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Describe when this rule should apply..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority (1-100, higher = executes first) *
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="input"
                    placeholder="weapon, fight, threat, violence"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Incidents containing these keywords will match this rule
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Role *
                    </label>
                    <select
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      className="input"
                    >
                      <option value="security">Security</option>
                      <option value="nurse">Nurse</option>
                      <option value="counselor">Counselor</option>
                      <option value="administrator">Administrator</option>
                      <option value="teacher">Teacher</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Routing Priority *
                    </label>
                    <select
                      value={formData.routingPriority}
                      onChange={(e) => setFormData({ ...formData, routingPriority: e.target.value })}
                      className="input"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confidence (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      value={formData.confidence}
                      onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Response Time
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedResponseTime}
                      onChange={(e) => setFormData({ ...formData, estimatedResponseTime: e.target.value })}
                      className="input"
                      placeholder="< 2 hours"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={!formData.name || !formData.targetRole || !formData.routingPriority}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Create Rule' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
