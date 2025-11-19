'use client';

interface AIInsightsPanelProps {
  aiRecommendation?: {
    recommended_role: string;
    confidence: number;
    priority: string;
    reasoning?: string;
    routing_method?: string;
  };
  incident?: {
    priority?: string;
    ai_confidence?: number;
  };
}

export function AIInsightsPanel({ aiRecommendation, incident }: AIInsightsPanelProps) {
  if (!aiRecommendation && !incident) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">No AI insights available</p>
      </div>
    );
  }

  const confidence = aiRecommendation?.confidence || incident?.ai_confidence || 0;
  const confidencePercent = Math.round(confidence * 100);

  const getConfidenceColor = () => {
    if (confidencePercent >= 80) return 'text-green-600 bg-green-100';
    if (confidencePercent >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-semibold text-purple-900">AI Insights</h3>
      </div>

      {/* Severity/Priority */}
      {(aiRecommendation?.priority || incident?.priority) && (
        <div>
          <p className="text-xs font-medium text-purple-700 mb-1">Severity</p>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(aiRecommendation?.priority || incident?.priority || 'medium')}`}>
              {(aiRecommendation?.priority || incident?.priority || 'medium').toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Recommended Role */}
      {aiRecommendation?.recommended_role && (
        <div>
          <p className="text-xs font-medium text-purple-700 mb-1">Recommended Role</p>
          <p className="text-sm font-semibold text-purple-900">
            {aiRecommendation.recommended_role}
          </p>
        </div>
      )}

      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-purple-700">AI Confidence</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor()}`}>
            {confidencePercent}%
          </span>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Reasoning */}
      {aiRecommendation?.reasoning && (
        <div>
          <p className="text-xs font-medium text-purple-700 mb-1">Reasoning</p>
          <p className="text-sm text-purple-800 leading-relaxed">
            {aiRecommendation.reasoning}
          </p>
        </div>
      )}

      {/* Routing Method */}
      {aiRecommendation?.routing_method && (
        <div className="pt-2 border-t border-purple-200">
          <p className="text-xs text-purple-600">
            Method: {aiRecommendation.routing_method.replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  );
}
