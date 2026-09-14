/**
 * Environment Variables Manager
 * Provides CRUD operations for .env file management
 * Allows dynamic configuration updates that persist across deployments
 */

import fs from 'fs';
import path from 'path';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');
const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example');

// In-memory fallback state for read-only / serverless platforms (e.g. Vercel, Railway dynamic envs)
const memoryStore = {};

/**
 * Parse .env file content into key-value pairs
 * Preserves comments and empty lines for round-trip editing
 */
export function parseEnvFile(content = '') {
  const lines = content.split('\n');
  const result = {
    variables: {},
    comments: {},
    order: [],
    rawLines: lines
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // Comment or empty line
      result.comments[index] = line;
      result.order.push({ type: 'comment', index });
    } else {
      // Variable assignment
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove quotes if enclosed
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        result.variables[key] = value;
        result.order.push({ type: 'variable', key, index });
      } else {
        // Malformed line, treat as comment
        result.comments[index] = line;
        result.order.push({ type: 'comment', index });
      }
    }
  });

  return result;
}

/**
 * Read and parse the .env file with memory store merge
 */
export function readEnvFile() {
  try {
    let parsed = { variables: {}, comments: {}, order: [], rawLines: [] };
    if (fs.existsSync(ENV_FILE_PATH)) {
      const content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      parsed = parseEnvFile(content);
    } else if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      const exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
      parsed = parseEnvFile(exampleContent);
    }

    // Merge memory modifications (useful for read-only environments like Vercel)
    Object.assign(parsed.variables, memoryStore);
    return parsed;
  } catch (error) {
    console.error('[EnvManager] Error reading .env file:', error.message);
    return { variables: { ...memoryStore }, comments: {}, order: [], rawLines: [] };
  }
}

/**
 * Write variables back to .env file preserving comments and formatting
 * Fallback to memoryStore & process.env update if file system is read-only or in cloud serverless
 */
export function writeEnvFile(variables, preserveStructure = true) {
  try {
    // Synchronize into runtime process.env instantly
    Object.entries(variables).forEach(([k, v]) => {
      process.env[k] = v;
      memoryStore[k] = v;
    });

    const parsed = readEnvFile();
    const lines = [...parsed.rawLines];
    const varsToWrite = { ...variables };

    // Update existing variables
    parsed.order.forEach(item => {
      if (item.type === 'variable' && varsToWrite.hasOwnProperty(item.key)) {
        lines[item.index] = `${item.key}=${varsToWrite[item.key]}`;
        delete varsToWrite[item.key];
      }
    });

    // Append new variables at the end
    const newVars = Object.entries(varsToWrite);
    if (newVars.length > 0) {
      if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
        lines.push('');
      }
      newVars.forEach(([key, value]) => {
        lines.push(`${key}=${value}`);
      });
    }

    const content = lines.join('\n');
    
    // Attempt file system write (VPS, Railway, Local)
    try {
      fs.writeFileSync(ENV_FILE_PATH, content, 'utf8');
    } catch (fsErr) {
      // Fallback for Vercel / read-only environment
      console.warn('[EnvManager] Filesystem read-only or permission denied. Applied changes to process memory:', fsErr.message);
    }

    return { success: true };
  } catch (error) {
    console.error('[EnvManager] Error writing .env file:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all environment variables (from .env file + process.env + memoryStore)
 * process.env takes precedence for security-sensitive values
 */
export function getAllEnvVars() {
  const parsed = readEnvFile();
  const result = { ...parsed.variables, ...memoryStore };

  // Merge with process.env
  Object.keys(process.env).forEach(key => {
    if (process.env[key] !== undefined) {
      result[key] = process.env[key];
    }
  });

  return result;
}

/**
 * Get a specific environment variable
 */
export function getEnvVar(key) {
  const parsed = readEnvFile();
  return process.env[key] || memoryStore[key] || parsed.variables[key] || null;
}

/**
 * Set a single environment variable
 */
export function setEnvVar(key, value) {
  const parsed = readEnvFile();
  parsed.variables[key] = value;
  process.env[key] = value;
  memoryStore[key] = value;
  return writeEnvFile(parsed.variables);
}

/**
 * Set multiple environment variables at once
 */
export function setEnvVars(variables) {
  const parsed = readEnvFile();
  Object.assign(parsed.variables, variables);
  Object.assign(memoryStore, variables);
  Object.entries(variables).forEach(([k, v]) => {
    process.env[k] = v;
  });
  return writeEnvFile(parsed.variables);
}

/**
 * Delete an environment variable
 */
export function deleteEnvVar(key) {
  const parsed = readEnvFile();
  if (parsed.variables.hasOwnProperty(key) || memoryStore.hasOwnProperty(key) || process.env.hasOwnProperty(key)) {
    delete parsed.variables[key];
    delete memoryStore[key];
    delete process.env[key];
    return writeEnvFile(parsed.variables);
  }
  return { success: true };
}

/**
 * Get categorized environment variables for UI display
 * Dynamic fallback ensures unknown/custom keys appear under 'other' (Lainnya)
 */
export function getCategorizedEnvVars() {
  const allVars = getAllEnvVars();
  const parsed = readEnvFile();

  const categories = {
    application: { label: 'Application', vars: [], icon: '📱' },
    admin: { label: 'Admin Authentication', vars: [], icon: '🔐' },
    telegram: { label: 'Telegram Bot', vars: [], icon: '🤖' },
    supabase: { label: 'Supabase (PostgreSQL)', vars: [], icon: '🗄️' },
    firestore: { label: 'Google Cloud Firestore', vars: [], icon: '☁️' },
    redis: { label: 'Redis Cache', vars: [], icon: '⚡' },
    mysql: { label: 'MySQL / MariaDB', vars: [], icon: '🐬' },
    mongodb: { label: 'MongoDB', vars: [], icon: '🍃' },
    nowpayments: { label: 'NOWPayments (Crypto)', vars: [], icon: '💰' },
    ai: { label: 'Google Gemini AI', vars: [], icon: '🧠' },
    audio: { label: 'Audio Alerts', vars: [], icon: '🔊' },
    other: { label: 'Lainnya', vars: [], icon: '⚙️' }
  };

  const categoryMap = {
    // Application
    NODE_ENV: 'application',
    PORT: 'application',
    APP_URL: 'application',
    VERCEL: 'application',
    RAILWAY_ENVIRONMENT: 'application',
    // Admin
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'admin',
    ADMIN_TELEGRAM_ID: 'admin',
    ADMIN_TELEGRAM_IDS: 'admin',
    TELEGRAM_ADMIN_ID: 'admin',
    TELEGRAM_ADMIN_IDS: 'admin',
    ADMIN_USER_ID: 'admin',
    ADMIN_USER_IDS: 'admin',
    // Telegram
    BOT_TOKEN: 'telegram',
    TELEGRAM_ADMIN_GROUP_ID: 'telegram',
    TELEGRAM_CHANNEL_ID: 'telegram',
    // Supabase
    SUPABASE_URL: 'supabase',
    SUPABASE_ANON_KEY: 'supabase',
    SUPABASE_SERVICE_ROLE_KEY: 'supabase',
    SUPABASE_DB_URL: 'supabase',
    // Firestore
    FIREBASE_SERVICE_ACCOUNT_BASE64: 'firestore',
    FIREBASE_PROJECT_ID: 'firestore',
    // Redis
    REDIS_URL: 'redis',
    // MySQL
    MYSQL_URL: 'mysql',
    // MongoDB
    MONGODB_URI: 'mongodb',
    // NOWPayments
    NOWPAYMENTS_API_KEY: 'nowpayments',
    NOWPAYMENTS_IPN_SECRET: 'nowpayments',
    NOWPAYMENTS_SANDBOX: 'nowpayments',
    // AI
    GOOGLE_GENAI_API_KEY: 'ai',
    GEMINI_API_KEY: 'ai',
    // Audio
    SOUND_PRESET: 'audio',
    SOUND_VOLUME: 'audio',
    SOUND_CUSTOM_URL: 'audio'
  };

  Object.entries(allVars).forEach(([key, value]) => {
    const category = categoryMap[key] || 'other';
    const isSecret = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PRIVATE');
    
    categories[category].vars.push({
      key,
      value: String(value ?? ''),
      isSecret,
      isInEnvFile: parsed.variables.hasOwnProperty(key),
      isInProcessEnv: process.env[key] !== undefined
    });
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].vars.length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

/**
 * Validate environment variable key format
 */
export function validateEnvKey(key) {
  return /^[A-Z_][A-Z0-9_]*$/.test(key);
}

/**
 * Validate environment variable value (basic validation)
 */
export function validateEnvValue(key, value) {
  if (value === undefined || value === null) return { valid: true };
  
  const strValue = String(value);
  
  // Check for common issues
  if (strValue.includes('\n') || strValue.includes('\r')) {
    return { valid: false, error: 'Value cannot contain newlines' };
  }
  
  // Warn about unquoted values with spaces
  if (strValue.includes(' ') && !strValue.startsWith('"') && !strValue.endsWith('"')) {
    return { valid: true, warning: 'Value contains spaces - consider quoting' };
  }
  
  return { valid: true };
}

/**
 * Create a backup of the current .env file
 */
export function backupEnvFile() {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) {
      return { success: false, error: 'No .env file to backup' };
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${ENV_FILE_PATH}.backup.${timestamp}`;
    fs.copyFileSync(ENV_FILE_PATH, backupPath);
    return { success: true, backupPath };
  } catch (error) {
    console.error('[EnvManager] Error creating backup:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Restore .env file from backup
 */
export function restoreEnvFile(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file not found' };
    }
    fs.copyFileSync(backupPath, ENV_FILE_PATH);
    
    // Refresh memory runtime
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const parsed = parseEnvFile(content);
    Object.entries(parsed.variables).forEach(([k, v]) => {
      process.env[k] = v;
      memoryStore[k] = v;
    });

    return { success: true };
  } catch (error) {
    console.error('[EnvManager] Error restoring backup:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * List available backup files
 */
export function listEnvBackups() {
  try {
    const files = fs.readdirSync(process.cwd());
    return files
      .filter(f => f.startsWith('.env.backup.'))
      .map(f => ({
        filename: f,
        path: path.join(process.cwd(), f),
        created: fs.statSync(path.join(process.cwd(), f)).mtime
      }))
      .sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('[EnvManager] Error listing backups:', error.message);
    return [];
  }
}

export default {
  parseEnvFile,
  readEnvFile,
  writeEnvFile,
  getAllEnvVars,
  getEnvVar,
  setEnvVar,
  setEnvVars,
  deleteEnvVar,
  getCategorizedEnvVars,
  validateEnvKey,
  validateEnvValue,
  backupEnvFile,
  restoreEnvFile,
  listEnvBackups
};
