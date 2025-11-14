import { logger } from './logger';

/**
 * Log environment variables (masking sensitive values)
 */
export function logEnvironmentVariables(serviceName: string, config: Record<string, any>): void {
  logger.info(`📋 Environment Variables for ${serviceName}:`);
  logger.info('='.repeat(60));
  
  const sensitiveKeys = [
    'SECRET',
    'PASSWORD',
    'TOKEN',
    'KEY',
    'CREDENTIAL',
    'AUTH',
    'PRIVATE',
    'ACCESS_KEY',
    'CLIENT_SECRET',
  ];

  const maskValue = (key: string, value: any): string => {
    if (value === undefined || value === null) {
      return '❌ NOT SET';
    }
    
    const strValue = String(value);
    
    // Check if key contains sensitive keywords
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toUpperCase().includes(sensitive)
    );
    
    if (isSensitive && strValue.length > 0) {
      // Mask sensitive values - show first 4 and last 4 chars
      if (strValue.length <= 8) {
        return '***MASKED***';
      }
      return `${strValue.substring(0, 4)}...${strValue.substring(strValue.length - 4)}`;
    }
    
    return strValue;
  };

  // Log all config values
  Object.entries(config).forEach(([key, value]) => {
    const maskedValue = maskValue(key, value);
    const status = value === undefined || value === null ? '❌' : '✅';
    logger.info(`${status} ${key}: ${maskedValue}`);
  });

  // Log raw process.env for debugging (masked)
  logger.info('='.repeat(60));
  logger.info('📦 Raw Process Environment (relevant vars only):');
  
  const relevantEnvVars = Object.keys(process.env)
    .filter(key => 
      key.includes('PORT') ||
      key.includes('URL') ||
      key.includes('URI') ||
      key.includes('SECRET') ||
      key.includes('KEY') ||
      key.includes('ENV') ||
      key.includes('S3') ||
      key.includes('AWS') ||
      key.includes('REDIS') ||
      key.includes('MONGO') ||
      key.includes('GOOGLE') ||
      key.includes('GITHUB')
    )
    .sort();

  relevantEnvVars.forEach(key => {
    const value = process.env[key];
    const maskedValue = maskValue(key, value || '');
    const status = value ? '✅' : '❌';
    logger.info(`${status} ${key}: ${maskedValue}`);
  });

  logger.info('='.repeat(60));
}

