/**
 * Structured Output Parser
 * Reliably parses structured JSON/XML from LLM responses
 * Based on research: structured output patterns and error handling
 */

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  raw?: string;
}

export interface StructuredOutput {
  narrative?: string;
  dialogue?: string;
  choices?: string[];
  stateChanges?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Structured Output Parser
 * Handles various formats: JSON, XML-like tags, markdown
 */
export class StructuredOutputParser {
  /**
   * Parse JSON from LLM response
   */
  parseJSON<T>(text: string, schema?: any): ParseResult<T> {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as T;
        return { success: true, data: parsed, raw: text };
      }

      // Try parsing entire text
      const parsed = JSON.parse(text) as T;
      return { success: true, data: parsed, raw: text };
    } catch (error) {
      return {
        success: false,
        error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        raw: text
      };
    }
  }

  /**
   * Parse XML-like tags from response
   * Example: <SET_FLAG>found_key=true</SET_FLAG>
   */
  parseXMLTags(text: string): ParseResult<Record<string, string>> {
    const tags: Record<string, string> = {};
    const tagPattern = /<(\w+)>([^<]*)<\/\1>/g;
    let match;

    while ((match = tagPattern.exec(text)) !== null) {
      const tagName = match[1];
      const tagValue = match[2].trim();
      tags[tagName] = tagValue;
    }

    if (Object.keys(tags).length > 0) {
      return { success: true, data: tags, raw: text };
    }

    return {
      success: false,
      error: 'No XML tags found',
      raw: text
    };
  }

  /**
   * Parse structured output with multiple formats
   */
  parseStructuredOutput(text: string): ParseResult<StructuredOutput> {
    const result: StructuredOutput = {};

    // Try JSON first
    const jsonResult = this.parseJSON<StructuredOutput>(text);
    if (jsonResult.success && jsonResult.data) {
      return jsonResult;
    }

    // Try XML tags
    const xmlResult = this.parseXMLTags(text);
    if (xmlResult.success && xmlResult.data) {
      // Convert XML tags to structured output
      if (xmlResult.data.NARRATIVE) {
        result.narrative = xmlResult.data.NARRATIVE;
      }
      if (xmlResult.data.DIALOGUE) {
        result.dialogue = xmlResult.data.DIALOGUE;
      }
      if (xmlResult.data.CHOICES) {
        result.choices = xmlResult.data.CHOICES.split(',').map(c => c.trim());
      }
      if (xmlResult.data.STATE_CHANGES) {
        try {
          result.stateChanges = JSON.parse(xmlResult.data.STATE_CHANGES);
        } catch {
          // Ignore parse errors
        }
      }

      if (Object.keys(result).length > 0) {
        return { success: true, data: result, raw: text };
      }
    }

    // Fallback: extract narrative from plain text
    const narrative = this.extractNarrative(text);
    if (narrative) {
      return {
        success: true,
        data: { narrative },
        raw: text
      };
    }

    return {
      success: false,
      error: 'Could not parse structured output',
      raw: text
    };
  }

  /**
   * Extract narrative text from response
   */
  private extractNarrative(text: string): string | undefined {
    // Remove markdown formatting
    let cleaned = text
      .replace(/^#+\s*/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .trim();

    // Remove JSON/XML artifacts
    cleaned = cleaned.replace(/^[{[]|[}\]]$/g, '').trim();

    if (cleaned.length > 10) {
      return cleaned;
    }

    return undefined;
  }

  /**
   * Validate parsed output against schema
   */
  validateOutput<T>(
    data: T,
    schema: {
      required?: string[];
      types?: Record<string, string>;
    }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (!(data as any)[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.types) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        const value = (data as any)[field];
        if (value !== undefined) {
          const actualType = typeof value;
          if (actualType !== expectedType) {
            errors.push(`Field ${field} has type ${actualType}, expected ${expectedType}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean and normalize LLM response
   */
  cleanResponse(text: string): string {
    return text
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
  }

  /**
   * Extract choices from text
   */
  extractChoices(text: string): string[] {
    // Try numbered list
    const numberedMatches = text.match(/^\d+[.)]\s*(.+)$/gm);
    if (numberedMatches) {
      return numberedMatches.map(m => m.replace(/^\d+[.)]\s*/, '').trim());
    }

    // Try bullet points
    const bulletMatches = text.match(/^[-*]\s*(.+)$/gm);
    if (bulletMatches) {
      return bulletMatches.map(m => m.replace(/^[-*]\s*/, '').trim());
    }

    // Try JSON array
    const arrayMatch = text.match(/\[(.*?)\]/s);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(`[${arrayMatch[1]}]`);
        if (Array.isArray(parsed)) {
          return parsed.map(String);
        }
      } catch {
        // Ignore
      }
    }

    return [];
  }
}

