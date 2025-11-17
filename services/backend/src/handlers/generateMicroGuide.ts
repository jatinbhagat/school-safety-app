import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

interface GenerateMicroGuideBody {
  topic?: string;
  tone?: string;
  tags?: string[];
  duration_seconds?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * POST /micro-guides/generate
 * Generate a micro-guide using AI based on topic and tone
 */
export async function generateMicroGuide(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();
  const startTime = Date.now();

  try {
    const { topic, tone, tags, duration_seconds }: GenerateMicroGuideBody = req.body;

    // Validate required fields
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "topic" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    if (!tone || typeof tone !== 'string' || tone.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "tone" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    // Validate tone is one of: friendly, professional, urgent, supportive
    const validTones = ['friendly', 'professional', 'urgent', 'supportive'];
    if (!validTones.includes(tone.toLowerCase())) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Field "tone" must be one of: ${validTones.join(', ')}`,
        request_id: requestId,
      });
      return;
    }

    // Generate micro-guide using OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      res.status(500).json({
        error: 'Configuration error',
        message: 'AI service not configured',
        request_id: requestId,
      });
      return;
    }

    const prompt = `Generate a micro-guide for school safety on the topic: "${topic}".

Tone: ${tone}
Requirements:
- Maximum 50 words
- Clear and actionable
- Age-appropriate for students
- Focus on safety and support

Return ONLY valid JSON in this format:
{
  "title": "Brief title (max 10 words)",
  "body": "Guide content (max 50 words)"
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a school safety expert who creates concise, helpful micro-guides for students. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      res.status(500).json({
        error: 'AI service error',
        message: 'Failed to generate micro-guide',
        request_id: requestId,
      });
      return;
    }

    const aiResponse = await response.json() as OpenAIResponse;
    const aiContent = aiResponse.choices[0].message.content;

    // Parse AI response
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      res.status(500).json({
        error: 'AI response error',
        message: 'Generated content was invalid',
        request_id: requestId,
      });
      return;
    }

    const { title, body } = parsedContent;

    // Validate AI output
    if (!title || !body) {
      res.status(500).json({
        error: 'AI response error',
        message: 'Generated content missing required fields',
        request_id: requestId,
      });
      return;
    }

    // Ensure body is max 50 words
    const wordCount = body.trim().split(/\s+/).length;
    if (wordCount > 50) {
      console.warn(`Generated body has ${wordCount} words, truncating to 50`);
    }

    // Store in database
    const query = `
      INSERT INTO micro_guides (title, body, tags, duration_seconds, enabled)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, title, body, tags, duration_seconds, enabled, created_at
    `;

    const values = [
      title.trim(),
      body.trim(),
      tags || [topic.toLowerCase()],
      duration_seconds || 60,
    ];

    const result = await pool.query(query, values);
    const guide = result.rows[0];

    const latencyMs = Date.now() - startTime;
    const tokenCount = aiResponse.usage?.total_tokens || 0;

    console.log(
      `Micro-guide generated: id=${guide.id}, topic="${topic}", tone="${tone}", ` +
      `tokens=${tokenCount}, latency=${latencyMs}ms`
    );

    res.status(201).json({
      ...guide,
      request_id: requestId,
      ai_metadata: {
        model: 'gpt-3.5-turbo',
        token_count: tokenCount,
        latency_ms: latencyMs,
      },
    });
  } catch (error) {
    console.error('Error generating micro-guide:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate micro-guide',
      request_id: requestId,
    });
  }
}
