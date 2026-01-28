/**
 * Convert various video URLs to embeddable format
 * Supports YouTube, Vimeo, and local video files
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/watch\?.*v=([^&\?\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from various URL formats
 * Supports:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 */
function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert video URL to embeddable format
 *
 * @param url - Original video URL (YouTube, Vimeo, or local file)
 * @returns Embeddable URL or original URL if not recognized
 */
export function getEmbeddableVideoUrl(url: string | undefined | null): string {
  if (!url) {
    return '';
  }

  // Check if it's already an embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    return url;
  }

  // Check if it's a local file path (starts with /api/files/videos/)
  if (url.startsWith('/api/files/videos/') || url.startsWith('http://localhost') || url.startsWith('blob:')) {
    return url;
  }

  // Try YouTube
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  // Try Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  // Return original URL if not recognized
  return url;
}

/**
 * Check if a URL is a valid video URL
 * @param url - URL to check
 * @returns true if URL is a valid video URL
 */
export function isValidVideoUrl(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }

  // Check for YouTube
  if (extractYouTubeId(url)) {
    return true;
  }

  // Check for Vimeo
  if (extractVimeoId(url)) {
    return true;
  }

  // Check for local video file
  if (url.startsWith('/api/files/videos/') || url.startsWith('http://localhost') || url.startsWith('blob:')) {
    return true;
  }

  // Check for embed URLs
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    return true;
  }

  return false;
}
