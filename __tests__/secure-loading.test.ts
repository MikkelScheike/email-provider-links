import { loadProviders, clearCache } from '../src/provider-loader';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// Mock getAllowedDomains to allow provider URLs
jest.mock('../src/url-validator', () => {
  const actual = jest.requireActual('../src/url-validator');
  return {
    ...actual,
    getAllowedDomains: jest.fn(() => new Set(['mail.google.com', 'gmail.com', 'tutanota.com', 'fastmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com']))
  };
});

describe('Secure Provider Loading', () => {
  const originalProvidersPath = join(__dirname, '../providers/emailproviders.json');
  const tempFilePath = join(__dirname, 'temp-providers.json');
  let originalContent: string;

  beforeAll(() => {
    // Save original content
    originalContent = readFileSync(originalProvidersPath, 'utf-8');
  });

  afterEach(() => {
    // Clean up and restore original state
    clearCache();
    if (require('fs').existsSync(tempFilePath)) {
      unlinkSync(tempFilePath);
    }
  });

  it('should load providers with security checks', () => {
    const result = loadProviders();
    
    // Basic structure
    expect(result).toHaveProperty('success', true);
    expect(Array.isArray(result.providers)).toBe(true);
    expect(result.providers.length).toBeGreaterThan(0);
    
    // Security report
    expect(result.securityReport).toBeDefined();
    expect(result.securityReport.hashVerification).toBe(true);
    expect(result.securityReport.urlValidation).toBe(true);
    expect(result.securityReport.securityLevel).toBe('SECURE');
  });

  it('should detect tampered provider data', () => {
    // Create a modified version of the providers file
    const modifiedContent = originalContent.replace('"gmail.com"', '"evil.com"');
    writeFileSync(tempFilePath, modifiedContent);
    
    // Try to load with modified content
    const result = loadProviders(tempFilePath);
    
    // Should fail hash verification
    expect(result.success).toBe(false);
    expect(result.securityReport.hashVerification).toBe(false);
    expect(result.securityReport.securityLevel).toBe('CRITICAL');
  });

  it('should handle missing provider file', () => {
    const nonExistentPath = join(__dirname, 'non-existent-file.json');
    const result = loadProviders(nonExistentPath);
    
    expect(result.success).toBe(false);
    expect(result.securityReport.securityLevel).toBe('CRITICAL');
    expect(result.securityReport.issues[0]).toMatch(/Failed to verify file/);
  });

  it('should validate provider URLs', () => {
    const result = loadProviders();
    
    // Check for invalid URLs in providers
    const invalidUrls = result.providers
      .filter(p => p.loginUrl)
      .filter(p => {
        try {
          new URL(p.loginUrl!);
          return false;
        } catch {
          return true;
        }
      });
    
    expect(invalidUrls).toHaveLength(0);
  });
});
