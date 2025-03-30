import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';
import { McpServer } from './mcpServers.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache directory path
const CACHE_DIR = path.join(__dirname, '..', 'data', 'cached');
const CACHE_TTL = config.cache.ttl;

// Validate API key before initializing OpenAI client
if (!config.openai.apiKeyIsValid) {
  console.error('ERROR: OpenAI API key is missing or invalid. Please check your .env file.');
  console.error('GitHub readme enrichment will not work without a valid API key.');
}

// Initialize OpenAI client with configuration
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

// Extended server interface with additional fields from README
export interface EnrichedMcpServer extends McpServer {
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
  prerequisites?: string[];
  lastEnrichmentTime?: number;
}

/**
 * Convert GitHub URL to raw README.md URL
 */
export function convertToRawReadmeUrl(githubUrl: string): string {
  // Remove trailing slash if present
  const normalizedUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl;
  
  // Convert from: https://github.com/Owner/Repo
  // To: https://raw.githubusercontent.com/Owner/Repo/refs/heads/main/README.md
  const parts = normalizedUrl.split('/');
  if (parts.length >= 5) {
    const owner = parts[3];
    const repo = parts[4];
    return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/README.md`;
  }
  
  throw new Error(`Invalid GitHub URL format: ${githubUrl}`);
}

/**
 * Fetch README.md content from GitHub
 */
export async function fetchReadmeContent(githubUrl: string): Promise<string> {
  try {
    const readmeUrl = convertToRawReadmeUrl(githubUrl);
    const response = await axios.get(readmeUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching README from ${githubUrl}:`, error);
    return '';
  }
}

/**
 * Extract structured information from README using OpenAI
 */
export async function extractInfoFromReadme(readmeContent: string): Promise<{
  name: string;
  description: string;
  Installation_instructions: string;
  Usage_instructions: string;
  features: string[];
  prerequisites: string[];
}> {
  try {
    if (!readmeContent) {
      throw new Error('README content is empty');
    }

    const prompt = `please use the README.md content to extra the following infomration in a json format 

{
    "name": "string",
    "description": "string",
    "Installation_instructions": "string",
    "Usage_instructions": "string",
    "features": [
        "string"
    ],
    "prerequisites": [
        "string"
    ]
}

here is the README.md markdown content
${readmeContent}
`;

    const modelName = config.openai.modelName;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts structured information from README files.' },
        { role: 'user', content: prompt },
      ],
      model: modelName,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }
    
    // Parse the JSON response
    const extractedInfo = JSON.parse(jsonMatch[0]);
    return extractedInfo;
  } catch (error) {
    console.error('Error extracting information from README:', error);
    return {
      name: '',
      description: '',
      Installation_instructions: '',
      Usage_instructions: '',
      features: [],
      prerequisites: []
    };
  }
}

/**
 * Initialize cache directory
 */
export async function initializeCacheDirectory(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log(`Cache directory initialized at ${CACHE_DIR}`);
  } catch (error) {
    console.error('Error initializing cache directory:', error);
  }
}

/**
 * Get cached server data if available and not expired
 */
export async function getCachedServerData(hubId: string): Promise<EnrichedMcpServer | null> {
  try {
    const cachePath = path.join(CACHE_DIR, `${hubId}.json`);
    const stats = await fs.stat(cachePath);
    const fileContent = await fs.readFile(cachePath, 'utf8');
    const cachedData = JSON.parse(fileContent) as EnrichedMcpServer;
    
    // Check if cache is still valid
    const now = Date.now();
    if (cachedData.lastEnrichmentTime && (now - cachedData.lastEnrichmentTime <= CACHE_TTL)) {
      return cachedData;
    }
    
    return null; // Cache expired
  } catch (error) {
    return null; // Cache doesn't exist or error reading it
  }
}

/**
 * Save enriched server data to cache
 */
export async function cacheServerData(serverData: EnrichedMcpServer): Promise<void> {
  try {
    const cachePath = path.join(CACHE_DIR, `${serverData.hubId}.json`);
    await fs.writeFile(cachePath, JSON.stringify(serverData, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error caching server data for ${serverData.hubId}:`, error);
  }
}

/**
 * Enrich server data with information from GitHub README
 */
export async function enrichServerData(server: McpServer): Promise<EnrichedMcpServer> {
  try {
    // Check cache first
    const cachedData = await getCachedServerData(server.hubId);
    if (cachedData) {
      console.log(`Using cached data for server ${server.hubId}`);
      return cachedData;
    }
    
    // If no cache or expired, fetch and process README
    if (!server.githubUrl) {
      throw new Error(`No GitHub URL available for server ${server.hubId}`);
    }

    const readmeContent = await fetchReadmeContent(server.githubUrl);
    const extractedInfo = await extractInfoFromReadme(readmeContent);
    
    // Merge original server data with extracted information
    const enrichedServer: EnrichedMcpServer = {
      ...server,
      ...extractedInfo,
      lastEnrichmentTime: Date.now(),
    };
    
    // Cache the enriched data
    await cacheServerData(enrichedServer);
    
    return enrichedServer;
  } catch (error) {
    console.error(`Error enriching server data for ${server.hubId}:`, error);
    return { ...server, lastEnrichmentTime: Date.now() };
  }
}

// Initialize cache directory on startup
initializeCacheDirectory().catch(err => {
  console.error('Failed to initialize cache directory:', err);
});