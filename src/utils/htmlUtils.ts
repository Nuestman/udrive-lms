// HTML utility functions for lesson content

/**
 * Decodes HTML entities in a string
 * @param str - String that may contain HTML entities
 * @returns Decoded string
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  
  // Create a temporary div element to decode HTML entities
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = str;
  return tempDiv.textContent || tempDiv.innerText || str;
}

/**
 * Converts YouTube URLs to embeddable format
 * @param htmlContent - HTML content that may contain YouTube URLs
 * @returns HTML content with YouTube URLs converted to embed format
 */
export function convertYouTubeUrls(htmlContent: string): string {
  if (!htmlContent) return htmlContent;
  
  return htmlContent
    // Convert YouTube watch URLs to embed format
    .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\s"']+)/gi, 
      'https://www.youtube.com/embed/$1')
    // Convert youtu.be short URLs to embed format
    .replace(/https?:\/\/(?:www\.)?youtu\.be\/([^&\s"']+)/gi,
      'https://www.youtube.com/embed/$1')
    // Convert existing iframe src attributes and ensure proper attributes
    .replace(/<iframe([^>]*)\ssrc="https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^"&]+)[^"]*"([^>]*)><\/iframe>/gi, 
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen></iframe>')
    .replace(/<iframe([^>]*)\ssrc="https?:\/\/(?:www\.)?youtu\.be\/([^"&?]+)[^"]*"([^>]*)><\/iframe>/gi,
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen></iframe>')
    // Ensure existing YouTube embeds have proper attributes
    .replace(/<iframe([^>]*)\ssrc="https?:\/\/www\.youtube\.com\/embed\/([^"&]+)[^"]*"([^>]*)><\/iframe>/gi, 
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen></iframe>');
}

/**
 * Fixes iframe attributes for better embedding support
 * @param htmlContent - HTML content containing iframes
 * @returns HTML content with fixed iframe attributes
 */
export function fixIframeAttributes(htmlContent: string): string {
  if (!htmlContent) return htmlContent;
  
  return htmlContent
    // Fix YouTube iframes - ensure they have proper attributes
    .replace(/<iframe([^>]*)\ssrc="https?:\/\/www\.youtube\.com\/embed\/([^"&]+)[^"]*"([^>]*)><\/iframe>/gi, (match, before, videoId, after) => {
      // Check if it already has proper attributes
      if (match.includes('width=') && match.includes('height=') && match.includes('frameborder=')) {
        return match;
      }
      // Return with proper attributes
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    })
    // Add sandbox and other security attributes for better browser compatibility
    .replace(/<iframe([^>]*)\ssrc="https?:\/\/www\.youtube\.com\/embed\/([^"&]+)[^"]*"([^>]*)><\/iframe>/gi,
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>');
}

// Debug function - can be called from browser console
(window as any).testYouTubeConversion = (url: string) => {
  const converted = convertYouTubeUrls(url);
  console.log('Original:', url);
  console.log('Converted:', converted);
  return converted;
};

/**
 * Cleans up lesson content that may have double-encoded HTML entities
 * @param content - Raw content from database
 * @returns Cleaned HTML content
 */
export function cleanLessonContent(content: any): string {
  if (!content) return '';
  
  let htmlContent = '';
  
  // Handle array format (JSONB)
  if (Array.isArray(content)) {
    htmlContent = content
      .map((block: any) => block.content || block.text || '')
      .join('');
  } 
  // Handle string format
  else if (typeof content === 'string') {
    htmlContent = content;
  }
  
  // Check if content has HTML entities that should be decoded
  if (htmlContent.includes('&lt;') && htmlContent.includes('&gt;')) {
    // This looks like double-encoded HTML, decode it
    htmlContent = decodeHtmlEntities(htmlContent);
  }
  
  // Sanitize whitespace and line breaks
  return sanitizeHtmlWhitespace(htmlContent);
}

/**
 * Sanitizes HTML content to remove excessive whitespace and normalize line breaks
 * @param htmlContent - HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtmlWhitespace(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // Convert YouTube URLs first
  htmlContent = convertYouTubeUrls(htmlContent);
  
  return htmlContent
    // Remove excessive line breaks and whitespace
    .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Multiple line breaks to double
    .replace(/^\s*\n/gm, '')            // Remove whitespace-only lines
    .replace(/\s+$/gm, '')              // Remove trailing whitespace
    .replace(/\s{3,}/g, ' ')            // Multiple spaces to single space
    // Clean up HTML structure
    .replace(/<p>\s*<\/p>/gi, '')       // Remove empty paragraphs
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '') // Remove paragraphs with only breaks
    .replace(/<div>\s*<\/div>/gi, '')   // Remove empty divs
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>') // Multiple breaks to single
    // Normalize spacing around HTML tags
    .replace(/>\s+</g, '><')            // Remove spaces between tags
    .replace(/\s+>/g, '>')              // Remove spaces before closing tags
    .replace(/<\s+/g, '<')              // Remove spaces after opening tags
    // Remove excessive whitespace from content
    .replace(/(\w)\s{2,}(\w)/g, '$1 $2') // Multiple spaces between words to single
    // Clean up final result
    .trim()
    // Ensure proper paragraph structure
    .replace(/^([^<\s])/m, '<p>$1')     // Wrap first text in paragraph if needed
    .replace(/([^>])\s*$/m, '$1</p>');  // Close paragraph if needed
}

/**
 * Safely renders HTML content by ensuring it's properly formatted
 * @param content - Content to render
 * @returns Clean HTML string
 */
export function prepareHtmlContent(content: any): string {
  const cleaned = cleanLessonContent(content);
  
  // Ensure the content has proper HTML structure
  if (cleaned && !cleaned.trim().startsWith('<')) {
    // If content doesn't start with HTML tags, wrap in paragraph
    return `<p>${cleaned}</p>`;
  }
  
  return cleaned;
}

/**
 * Sanitizes content from TinyMCE editor before saving to database
 * @param editorContent - Raw content from TinyMCE editor
 * @returns Sanitized content ready for database storage
 */
export function sanitizeEditorContent(editorContent: string): string {
  if (!editorContent) return '';
  
  // Convert YouTube URLs first
  editorContent = convertYouTubeUrls(editorContent);
  
  return editorContent
    // Remove excessive line breaks and whitespace
    .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Multiple line breaks to double
    .replace(/^\s*\n/gm, '')            // Remove whitespace-only lines
    .replace(/\s+$/gm, '')              // Remove trailing whitespace
    .replace(/\s{2,}/g, ' ')            // Multiple spaces to single space
    // Clean up HTML structure
    .replace(/<p>\s*<\/p>/gi, '')       // Remove empty paragraphs
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '') // Remove paragraphs with only breaks
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>') // Multiple breaks to single
    // Normalize spacing around HTML tags
    .replace(/>\s+</g, '><')            // Remove spaces between tags
    .replace(/\s+>/g, '>')              // Remove spaces before closing tags
    .replace(/<\s+/g, '<')              // Remove spaces after opening tags
    // Clean up final result
    .trim();
}
