import { jest } from '@jest/globals';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import * as hashVerifier from '../src/hash-verifier';

// Mock fs and path modules
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/')
}));

describe('Hash Verification System', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('calculateHash', () => {
    it('should calculate correct SHA-256 hash for string input', () => {
      const testString = 'test-content';
      const expectedHash = createHash('sha256').update(testString).digest('hex');
      
      expect(hashVerifier.calculateHash(testString)).toBe(expectedHash);
    });

    it('should calculate correct SHA-256 hash for Buffer input', () => {
      const testBuffer = Buffer.from('test-content');
      const expectedHash = createHash('sha256').update(testBuffer).digest('hex');
      
      expect(hashVerifier.calculateHash(testBuffer)).toBe(expectedHash);
    });
  });

  describe('calculateFileHash', () => {
    it('should calculate correct file hash', () => {
      const testContent = 'test-file-content';
      const testPath = '/test/file.json';
      (readFileSync as jest.Mock).mockReturnValue(testContent);
      
      const expectedHash = createHash('sha256').update(testContent).digest('hex');
      expect(hashVerifier.calculateFileHash(testPath)).toBe(expectedHash);
      expect(readFileSync).toHaveBeenCalledWith(testPath);
    });

    it('should throw error when file read fails', () => {
      const testPath = '/nonexistent/file.json';
      (readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      
      expect(() => hashVerifier.calculateFileHash(testPath)).toThrow('File not found');
    });
  });

  describe('verifyProvidersIntegrity', () => {
    it('should return valid result when hash matches', () => {
      const testContent = 'test-content';
      const testPath = 'emailproviders.json';
      const testHash = createHash('sha256').update(testContent).digest('hex');
      
      (readFileSync as jest.Mock).mockReturnValue(testContent);
      
      const result = hashVerifier.verifyProvidersIntegrity(testPath, testHash);
      expect(result.isValid).toBe(true);
      expect(result.actualHash).toBe(testHash);
      expect(result.expectedHash).toBe(testHash);
    });

    it('should detect hash mismatch', () => {
      const testContent = 'test-content';
      const testPath = 'emailproviders.json';
      const expectedHash = 'wrong-hash';
      
      (readFileSync as jest.Mock).mockReturnValue(testContent);
      
      const result = hashVerifier.verifyProvidersIntegrity(testPath, expectedHash);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('potential tampering detected');
    });
  });

  describe('verifyProvidersDataIntegrity', () => {
    const testData = {
      provider1: { url: 'test.com' },
      provider2: { url: 'example.com' }
    };

    it('should verify data integrity correctly', () => {
      const jsonString = JSON.stringify(testData, Object.keys(testData).sort(), 2);
      const expectedHash = createHash('sha256').update(jsonString).digest('hex');
      
      const result = hashVerifier.verifyProvidersDataIntegrity(testData, expectedHash);
      expect(result.isValid).toBe(true);
      expect(result.actualHash).toBe(expectedHash);
    });

    it('should handle missing expected hash', () => {
      const result = hashVerifier.verifyProvidersDataIntegrity(testData, 'TO_BE_CALCULATED');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Expected hash not configured');
    });
  });

  describe('handleHashMismatch', () => {
    const mockResult = {
      isValid: false,
      actualHash: 'actual-hash',
      expectedHash: 'expected-hash',
      reason: 'Test failure',
      file: 'test.json'
    };

    it('should handle error logging correctly', () => {
      hashVerifier.handleHashMismatch(mockResult, { logLevel: 'error' });
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle warning logging correctly', () => {
      hashVerifier.handleHashMismatch(mockResult, { logLevel: 'warn' });
      expect(console.warn).toHaveBeenCalled();
    });

    it('should throw error when throwOnMismatch is true', () => {
      expect(() => {
        hashVerifier.handleHashMismatch(mockResult, { throwOnMismatch: true });
      }).toThrow();
    });

    it('should call custom onMismatch handler', () => {
      const onMismatch = jest.fn();
      hashVerifier.handleHashMismatch(mockResult, { onMismatch });
      expect(onMismatch).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('createProviderManifest', () => {
    const testProviders = [
      { companyProvider: 'Test1', loginUrl: 'https://test1.com' },
      { companyProvider: 'Test2', loginUrl: 'https://test2.com' }
    ];

    it('should create valid manifest with correct structure', () => {
      const manifest = hashVerifier.createProviderManifest(testProviders);
      
      expect(manifest).toHaveProperty('timestamp');
      expect(manifest).toHaveProperty('providerCount', 2);
      expect(manifest).toHaveProperty('urlHashes');
      expect(manifest).toHaveProperty('manifestHash');
      
      // Verify URL hashes are created
      expect(Object.keys(manifest.urlHashes).length).toBe(2);
    });

    it('should generate consistent hashes for same input', () => {
      const manifest1 = hashVerifier.createProviderManifest(testProviders);
      const manifest2 = hashVerifier.createProviderManifest(testProviders);
      
      // Timestamps will differ, but URL hashes should be identical
      expect(manifest1.urlHashes).toEqual(manifest2.urlHashes);
    });
  });
});
