import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Proxy route for FileToLink content - now deprecated
 * Frontend now fetches directly from FileToLink with secret token
 */
router.get('/proxy/:fileId(*)', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Decode the URL
    const decodedUrl = decodeURIComponent(fileId);
    logger.info(`Proxy route called for: ${decodedUrl}`);
    
    // Return a message that direct frontend access is now used
    return res.status(200).json({
      message: 'Direct frontend access is now used',
      info: 'Frontend fetches directly from FileToLink with secret token',
      url: decodedUrl,
      note: 'This proxy route is deprecated - frontend handles authentication directly'
    });
    
  } catch (error) {
    logger.error('Proxy route error:', error);
    return res.status(500).json({
      error: 'Proxy route error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get FileToLink content info without downloading
 */
router.head('/proxy/:fileId(*)', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Decode the URL
    const decodedUrl = decodeURIComponent(fileId);
    logger.info(`Proxying HEAD request to FileToLink: ${decodedUrl}`);
    
    // Make HEAD request to get file info
    const response = await fetch(decodedUrl, {
      method: 'HEAD'
    });
    
    logger.info(`FileToLink HEAD response status: ${response.status}`);
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get file info from FileToLink server',
        status: response.status,
        statusText: response.statusText
      });
    }
    
    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges);
    }
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    res.status(200).end();
    
  } catch (error) {
    logger.error('FileToLink HEAD proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate FileToLink cookies for client-side use
 */
router.get('/cookies', (req, res) => {
  try {
    res.json({ message: 'Cookies generation is now handled by frontend' });
  } catch (error) {
    logger.error('Error generating cookies:', error);
    res.status(500).json({
      error: 'Failed to generate cookies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

