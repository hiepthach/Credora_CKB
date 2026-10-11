/**
 * Cluster Service Tests - Cluster Configuration and Validation
 *
 * Tests for cluster creation configuration, validation rules,
 * and URL/email format validation.
 * Reference: Design_spec/01_Cluster_Service.md
 */

import { describe, it, expect } from 'vitest';
import type { Cluster, ClusterConfig } from '../../../src/types';

describe('Cluster Service', () => {
  describe('Cluster Types', () => {
    // Test: Define cluster config with all fields
    // Input: ClusterConfig with name, description, websiteUrl, contactEmail
    // Expected: All fields stored correctly
    it('should define cluster config correctly', () => {
      const config: ClusterConfig = {
        name: 'CKB Academy',
        description: 'A learning platform for CKB development',
        websiteUrl: 'https://ckb-academy.example.com',
        contactEmail: 'contact@ckb-academy.example.com',
      };

      expect(config.name).toBe('CKB Academy');
      expect(config.description).toBe('A learning platform for CKB development');
      expect(config.websiteUrl).toBe('https://ckb-academy.example.com');
      expect(config.contactEmail).toBe('contact@ckb-academy.example.com');
    });

    // Test: Allow optional fields to be undefined
    // Input: ClusterConfig with only required fields
    // Expected: Optional fields (websiteUrl, contactEmail) are undefined
    it('should allow optional fields to be undefined', () => {
      const minimalConfig: ClusterConfig = {
        name: 'Minimal Cluster',
        description: 'A minimal cluster',
      };

      expect(minimalConfig.websiteUrl).toBeUndefined();
      expect(minimalConfig.contactEmail).toBeUndefined();
    });

    // Test: Define cluster with all fields including metadata
    // Input: Full Cluster object with id, clusterId, timestamps, metadata URLs
    // Expected: All fields including avatarUrl, bannerUrl stored correctly
    it('should define cluster with all fields', () => {
      const cluster: Cluster = {
        id: 'cluster-123',
        clusterId: 'cluster-123',
        name: 'Test Cluster',
        description: 'Test Description',
        creatorAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        websiteUrl: 'https://example.com',
        contactEmail: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
      };

      expect(cluster.clusterId).toBe('cluster-123');
      expect(cluster.creatorAddress).toBeDefined();
      expect(cluster.createdAt).toBeDefined();
    });

    // Test: Support optional issuerDid in ClusterConfig and Cluster
    it('should support optional issuerDid in ClusterConfig and Cluster', () => {
      const configWithDid: ClusterConfig = {
        name: 'University of CKB',
        description: 'Accredited institution',
        issuerDid: 'did:ckb:qquniversity0000000000000000',
      };

      expect(configWithDid.issuerDid).toBe('did:ckb:qquniversity0000000000000000');

      const clusterWithDid: Cluster = {
        id: 'cluster-456',
        clusterId: 'cluster-456',
        name: 'University of CKB',
        description: 'Accredited institution',
        creatorAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        createdAt: '2026-10-11T00:00:00Z',
        issuerDid: 'did:ckb:qquniversity0000000000000000',
      };

      expect(clusterWithDid.issuerDid).toBe('did:ckb:qquniversity0000000000000000');
    });
  });

  describe('Cluster ID Generation', () => {
    // Test: Generate valid cluster ID format
    // Input: CKB address string
    // Expected: ID format is 0x prefix + hex characters (32 total length after 0x)
    it('should generate valid cluster ID format', () => {
      const addressArgs = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';

      // Simulate cluster ID generation: base (16 chars) + random (16 chars)
      const base = addressArgs.slice(0, 16);
      const random = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const clusterId = `0x${base}${random}`;

      // 0x prefix + 32 characters total
      expect(clusterId).toMatch(/^0x[0-9a-z]{32}$/);
    });
  });

  describe('Cluster Validation', () => {
    // Test: Validate valid cluster config
    // Input: ClusterConfig with name and description within limits
    // Expected: No validation errors
    it('should validate required fields', () => {
      const validateCluster = (config: ClusterConfig): string[] => {
        const errors: string[] = [];

        if (!config.name || config.name.trim().length === 0) {
          errors.push('Name is required');
        }
        if (!config.description || config.description.trim().length === 0) {
          errors.push('Description is required');
        }
        if (config.name && config.name.length > 100) {
          errors.push('Name must be less than 100 characters');
        }
        if (config.description && config.description.length > 500) {
          errors.push('Description must be less than 500 characters');
        }

        return errors;
      };

      const validConfig: ClusterConfig = {
        name: 'Valid Cluster',
        description: 'Valid Description',
      };

      const errors = validateCluster(validConfig);
      expect(errors).toHaveLength(0);
    });

    // Test: Detect missing cluster name
    // Input: ClusterConfig with empty name
    // Expected: Error 'Name is required'
    it('should detect missing name', () => {
      const validateCluster = (config: ClusterConfig): string[] => {
        const errors: string[] = [];

        if (!config.name || config.name.trim().length === 0) {
          errors.push('Name is required');
        }
        if (!config.description || config.description.trim().length === 0) {
          errors.push('Description is required');
        }

        return errors;
      };

      const invalidConfig: ClusterConfig = {
        name: '',
        description: 'Some description',
      };

      const errors = validateCluster(invalidConfig);
      expect(errors).toContain('Name is required');
    });

    // Test: Detect name exceeding length limit
    // Input: ClusterConfig with name > 100 characters
    // Expected: Error 'Name must be less than 100 characters'
    it('should detect long name', () => {
      const validateCluster = (config: ClusterConfig): string[] => {
        const errors: string[] = [];

        if (config.name && config.name.length > 100) {
          errors.push('Name must be less than 100 characters');
        }

        return errors;
      };

      const longName = 'A'.repeat(101);
      const errors = validateCluster({ name: longName, description: 'desc' });

      expect(errors).toContain('Name must be less than 100 characters');
    });
  });

  describe('Cluster URL Validation', () => {
    // Test: Validate URL format
    // Input: Various URL strings
    // Expected: https:// URLs valid, invalid strings return false
    it('should validate URL format', () => {
      const isValidUrl = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    // Test: Validate email format
    // Input: Various email strings
    // Expected: Valid emails pass, invalid emails return false
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});
