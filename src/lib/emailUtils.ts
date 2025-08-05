/**
 * Email utility functions for template processing
 */

/**
 * Extracts placeholder variables from a mustache-style template
 * @param template - The template string containing {{variable}} placeholders
 * @returns Array of unique placeholder names
 */
export const extractPlaceholders = (template: string): string[] => {
  const placeholderRegex = /{{([^{}]+)}}/g;
  const matches = template.match(placeholderRegex) || [];
  return matches
    .map(match => match.replace(/{{|}}/g, '').trim())
    .filter(placeholder => !placeholder.startsWith('#') && !placeholder.startsWith('/'))
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
};

/**
 * Replaces placeholders in a template with actual values
 * @param template - The template string
 * @param data - Object containing placeholder values
 * @returns Template with placeholders replaced
 */
export const replacePlaceholders = (template: string, data: Record<string, string>): string => {
  let result = template;
  
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

/**
 * Validates template syntax for mustache-style placeholders
 * @param template - The template string to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateTemplateSyntax = (template: string): { isValid: boolean; error?: string } => {
  try {
    // Check for unclosed mustache tags
    const openTags = (template.match(/{{\s*[^}]+/g) || []).length;
    const closeTags = (template.match(/}}/g) || []).length;
    
    if (openTags !== closeTags) {
      return {
        isValid: false,
        error: 'Template has unclosed mustache tags'
      };
    }
    
    // Check for nested mustache tags (not supported)
    const nestedTags = template.match(/{{[^}]*{{/g);
    if (nestedTags && nestedTags.length > 0) {
      return {
        isValid: false,
        error: 'Nested mustache tags are not supported'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Template syntax error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Generates sample data for template preview based on placeholder names
 * @param placeholders - Array of placeholder names
 * @returns Object with sample data for each placeholder
 */
export const generateSampleData = (placeholders: string[]): Record<string, string> => {
  const sampleData: Record<string, string> = {};
  
  placeholders.forEach(placeholder => {
    const lowerCase = placeholder.toLowerCase();
    
    if (lowerCase.includes('name')) {
      sampleData[placeholder] = 'John Doe';
    } else if (lowerCase.includes('email')) {
      sampleData[placeholder] = 'john.doe@example.com';
    } else if (lowerCase.includes('amount') || lowerCase.includes('price')) {
      sampleData[placeholder] = '100.00';
    } else if (lowerCase.includes('date')) {
      sampleData[placeholder] = new Date().toLocaleDateString();
    } else if (lowerCase.includes('code')) {
      sampleData[placeholder] = 'ABC123';
    } else if (lowerCase.includes('link') || lowerCase.includes('url')) {
      sampleData[placeholder] = 'https://example.com';
    } else if (lowerCase.includes('status')) {
      sampleData[placeholder] = 'active';
    } else if (lowerCase.includes('phone')) {
      sampleData[placeholder] = '(555) 123-4567';
    } else if (lowerCase.includes('address')) {
      sampleData[placeholder] = '123 Main St, City, State 12345';
    } else {
      sampleData[placeholder] = `[${placeholder}]`;
    }
  });
  
  return sampleData;
};