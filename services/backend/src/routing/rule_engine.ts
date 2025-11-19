/**
 * Routing Rule Engine
 *
 * Provides deterministic rule-based routing and ML-based classification
 * for incident triage and assignment.
 */

import { logAIOutput } from '../audit/log_ai_output';

export interface RoutingRecommendation {
  role: string;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_response_time?: string; // e.g., "< 1 hour"
}

export interface IncidentInput {
  id: number;
  category: string;
  description?: string;
  severity?: number; // 1-10 scale
  class_section?: string;
  attachments?: any[];
  created_at?: Date;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number; // Higher number = higher priority
  condition: (incident: IncidentInput) => boolean;
  route: {
    role: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_response_time?: string;
  };
  confidence: number;
}

/**
 * Deterministic rule set for incident routing
 */
const ROUTING_RULES: RoutingRule[] = [
  // Critical/Emergency Rules
  {
    id: 'rule_001',
    name: 'Active Threat',
    priority: 100,
    condition: (incident) => {
      const keywords = ['weapon', 'gun', 'knife', 'threat', 'violence', 'fight', 'attack'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'security',
      priority: 'critical',
      estimated_response_time: '< 5 minutes'
    },
    confidence: 0.95
  },
  {
    id: 'rule_002',
    name: 'Medical Emergency',
    priority: 95,
    condition: (incident) => {
      const keywords = ['injury', 'hurt', 'bleeding', 'unconscious', 'medical', 'emergency', 'ambulance', 'nurse'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'nurse',
      priority: 'critical',
      estimated_response_time: '< 5 minutes'
    },
    confidence: 0.95
  },

  // High Priority Rules
  {
    id: 'rule_003',
    name: 'Bullying Incident',
    priority: 80,
    condition: (incident) => {
      const keywords = ['bully', 'bullying', 'harassment', 'intimidation', 'threatening'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'counselor',
      priority: 'high',
      estimated_response_time: '< 1 hour'
    },
    confidence: 0.90
  },
  {
    id: 'rule_004',
    name: 'Mental Health Crisis',
    priority: 85,
    condition: (incident) => {
      const keywords = ['suicide', 'self-harm', 'depression', 'anxiety', 'mental health', 'crisis'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'counselor',
      priority: 'critical',
      estimated_response_time: '< 15 minutes'
    },
    confidence: 0.92
  },
  {
    id: 'rule_005',
    name: 'Substance Abuse',
    priority: 75,
    condition: (incident) => {
      const keywords = ['drug', 'alcohol', 'smoking', 'vaping', 'substance', 'intoxicated'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'administrator',
      priority: 'high',
      estimated_response_time: '< 30 minutes'
    },
    confidence: 0.88
  },

  // Medium Priority Rules
  {
    id: 'rule_006',
    name: 'Behavioral Issue',
    priority: 60,
    condition: (incident) => {
      const keywords = ['disruptive', 'behavior', 'discipline', 'misconduct', 'defiant', 'disrespect'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'administrator',
      priority: 'medium',
      estimated_response_time: '< 2 hours'
    },
    confidence: 0.85
  },
  {
    id: 'rule_007',
    name: 'Facility/Maintenance Issue',
    priority: 50,
    condition: (incident) => {
      const keywords = ['broken', 'maintenance', 'facility', 'repair', 'damage', 'vandalism', 'graffiti'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'maintenance',
      priority: 'medium',
      estimated_response_time: '< 4 hours'
    },
    confidence: 0.80
  },
  {
    id: 'rule_008',
    name: 'Academic Concern',
    priority: 40,
    condition: (incident) => {
      const keywords = ['academic', 'cheating', 'plagiarism', 'grade', 'homework', 'test'];
      const text = `${incident.category} ${incident.description || ''}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    },
    route: {
      role: 'teacher',
      priority: 'medium',
      estimated_response_time: '< 1 day'
    },
    confidence: 0.75
  },

  // Low Priority Rules (Catch-all with severity-based routing)
  {
    id: 'rule_009',
    name: 'High Severity Incident',
    priority: 30,
    condition: (incident) => {
      return (incident.severity || 0) >= 7;
    },
    route: {
      role: 'administrator',
      priority: 'high',
      estimated_response_time: '< 1 hour'
    },
    confidence: 0.70
  },
  {
    id: 'rule_010',
    name: 'Default General Staff',
    priority: 10,
    condition: () => true, // Catch-all
    route: {
      role: 'staff',
      priority: 'low',
      estimated_response_time: '< 1 day'
    },
    confidence: 0.60
  }
];

/**
 * Rule-based routing engine
 */
export class RuleEngine {
  private rules: RoutingRule[];

  constructor(rules: RoutingRule[] = ROUTING_RULES) {
    // Sort rules by priority (highest first)
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Route an incident using deterministic rules
   */
  route(incident: IncidentInput): RoutingRecommendation {
    // Find first matching rule (highest priority wins)
    for (const rule of this.rules) {
      if (rule.condition(incident)) {
        return {
          role: rule.route.role,
          confidence: rule.confidence,
          reasoning: `Matched rule: ${rule.name} (${rule.id})`,
          priority: rule.route.priority,
          estimated_response_time: rule.route.estimated_response_time
        };
      }
    }

    // Fallback (should never reach here due to catch-all rule)
    return {
      role: 'staff',
      confidence: 0.50,
      reasoning: 'Default fallback routing',
      priority: 'low'
    };
  }

  /**
   * Get all matching rules for an incident (for debugging/analysis)
   */
  getAllMatches(incident: IncidentInput): RoutingRule[] {
    return this.rules.filter(rule => rule.condition(incident));
  }
}

/**
 * ML-based classifier (stub implementation)
 *
 * In a production environment, this would:
 * 1. Load a trained model (e.g., TensorFlow.js, ONNX)
 * 2. Preprocess text (tokenization, embeddings)
 * 3. Run inference
 * 4. Return probabilistic predictions
 */
export class MLClassifier {
  private modelLoaded: boolean = false;

  constructor() {
    // Stub: In production, load model here
    this.modelLoaded = false;
  }

  /**
   * Load ML model (stub)
   */
  async loadModel(): Promise<void> {
    // Stub: Load model from file/API
    console.log('[ML Classifier] Model loading stubbed - not implemented');
    this.modelLoaded = true;
  }

  /**
   * Predict routing using ML (stub implementation)
   * Returns mock predictions with lower confidence to indicate it's a stub
   */
  async predict(incident: IncidentInput): Promise<RoutingRecommendation> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    // Stub: Mock ML prediction
    // In production, this would run actual inference
    const mockPredictions = [
      { role: 'administrator', probability: 0.35 },
      { role: 'counselor', probability: 0.25 },
      { role: 'security', probability: 0.20 },
      { role: 'staff', probability: 0.20 }
    ];

    const topPrediction = mockPredictions[0];

    // TODO: When implementing real AI/ML calls, add audit logging here:
    // const startTime = Date.now();
    // const prompt = `Route this incident: ${JSON.stringify(incident)}`;
    // const response = await callAIModel(prompt);
    // const latency = Date.now() - startTime;
    //
    // await logAIOutput({
    //   incident_id: incident.id,
    //   model: 'your-model-name',
    //   prompt: prompt,
    //   output_json: response,
    //   token_count: response.usage?.total_tokens,
    //   latency_ms: latency
    // });

    return {
      role: topPrediction.role,
      confidence: topPrediction.probability,
      reasoning: 'ML prediction (STUB - not trained)',
      priority: 'medium',
      estimated_response_time: '< 2 hours'
    };
  }

  /**
   * Get all predictions with probabilities (stub)
   */
  async predictAll(incident: IncidentInput): Promise<Array<{ role: string; probability: number }>> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    // Stub: Return mock probabilities
    return [
      { role: 'administrator', probability: 0.35 },
      { role: 'counselor', probability: 0.25 },
      { role: 'security', probability: 0.20 },
      { role: 'staff', probability: 0.20 }
    ];
  }
}

/**
 * Hybrid routing engine that combines rule-based and ML approaches
 */
export class HybridRoutingEngine {
  private ruleEngine: RuleEngine;
  private mlClassifier: MLClassifier;

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.mlClassifier = new MLClassifier();
  }

  /**
   * Route using hybrid approach:
   * 1. Try rule-based first (high confidence)
   * 2. Fall back to ML for ambiguous cases
   * 3. Use confidence threshold to decide
   */
  async route(incident: IncidentInput): Promise<RoutingRecommendation> {
    // Get rule-based recommendation
    const ruleRecommendation = this.ruleEngine.route(incident);

    // If high confidence rule match, use it
    if (ruleRecommendation.confidence >= 0.85) {
      return ruleRecommendation;
    }

    // For lower confidence, combine with ML prediction
    const mlRecommendation = await this.mlClassifier.predict(incident);

    // If rule and ML agree, boost confidence
    if (ruleRecommendation.role === mlRecommendation.role) {
      return {
        ...ruleRecommendation,
        confidence: Math.min(0.98, (ruleRecommendation.confidence + mlRecommendation.confidence) / 2 + 0.1),
        reasoning: `${ruleRecommendation.reasoning} + ML confirmation`
      };
    }

    // If they disagree, return the higher confidence one
    return ruleRecommendation.confidence >= mlRecommendation.confidence
      ? ruleRecommendation
      : mlRecommendation;
  }
}

// Export singleton instances
export const ruleEngine = new RuleEngine();
export const mlClassifier = new MLClassifier();
export const hybridEngine = new HybridRoutingEngine();
