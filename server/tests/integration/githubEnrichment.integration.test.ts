import { describe, it, expect, beforeAll } from 'vitest';
import { extractInfoFromReadme, fetchReadmeContent } from '../../src/lib/githubEnrichment';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');

// Force reload environment variables
dotenv.config({ path: envPath });

// Skip tests if OpenAI API key is not available
const runTests = Boolean(process.env.OPENAI_API_KEY);

// Sample GitHub repositories with README files to test
const TEST_REPOS = [
  {
    name: 'AWS Knowledge Base',
    url: 'https://github.com/sammcj/mcp-aws-kb',
    hubId: '0a0cff94-1f03-4d1f-b5cc-a41d464f575e'
  },
  {
    name: 'Hyperbrowser',
    url: 'https://docs.hyperbrowser.ai/guides/model-context-protocol',
    hubId: '0a18e1c1-8c3b-4fd4-b806-b2dc0326d734'
  }
];

// Only run these tests if an OpenAI API key is configured
(runTests ? describe : describe.skip)('OpenAI Integration Tests', () => {
  beforeAll(() => {
    // Ensure we have API credentials
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Skipping OpenAI integration tests: No API key found in .env file');
      return;
    }
    
    console.log('Running OpenAI integration tests with real API calls');
    console.log(`API Base URL: ${process.env.OPENAI_BASE_URL}`);
    console.log(`Model: ${process.env.MODEL_NAME}`);
  });

  it('should fetch real READMEs from GitHub for all test repositories', async () => {
    for (const repo of TEST_REPOS) {
      console.log(`Testing repository: ${repo.name} (${repo.url})`);
      const readmeContent = await fetchReadmeContent(repo.url);
      
      // Log first 100 characters of the README for verification
      console.log(`Fetched README from ${repo.name} (${readmeContent.substring(0, 100)}...)`);
      
      expect(readmeContent).toBeTruthy();
      expect(readmeContent.length).toBeGreaterThan(100);
    }
  }, 20000); // Increased timeout for multiple network requests

  it('should extract information from GitHub READMEs using OpenAI for all test repositories', async () => {
    for (const repo of TEST_REPOS) {
      console.log(`Testing extraction for repository: ${repo.name} (${repo.url})`);
      const readmeContent = await fetchReadmeContent(repo.url);
      
      // Skip if README couldn't be fetched
      if (!readmeContent) {
        console.warn(`Skipping extraction test: Could not fetch README from ${repo.url}`);
        continue;
      }
      
      console.log(`Extracting information from ${repo.name} README using OpenAI...`);
      const extractedInfo = await extractInfoFromReadme(readmeContent);
      
      // Log the extracted information
      console.log(`Extracted information for ${repo.name}:`, JSON.stringify(extractedInfo, null, 2));
      
      // Basic validation of extracted fields
      expect(extractedInfo).toBeTruthy();
      expect(extractedInfo.name).toBeTruthy();
      expect(extractedInfo.description).toBeTruthy();
      
      // Save the extracted results for manual inspection
      const testResultsDir = path.resolve(__dirname, '..', 'results');
      
      try {
        // Create results directory if it doesn't exist
        if (!fs.existsSync(testResultsDir)) {
          fs.mkdirSync(testResultsDir, { recursive: true });
        }
        
        // Save the extracted information
        const resultsPath = path.join(testResultsDir, `${repo.hubId}_test_results.json`);
        fs.writeFileSync(
          resultsPath, 
          JSON.stringify({ 
            repository: repo,
            readmePreview: readmeContent.substring(0, 500) + (readmeContent.length > 500 ? '...' : ''),
            extractedInfo 
          }, null, 2)
        );
        
        console.log(`Test results saved to ${resultsPath}`);
      } catch (error) {
        console.error(`Error saving test results for ${repo.name}:`, error);
      }
    }
  }, 60000); // Increased timeout for multiple AI processing requests
});