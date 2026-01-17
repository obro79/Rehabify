import { describe, it, expect } from 'vitest';

describe('Terms of Service Page', () => {
  it('should export metadata with correct title and description', async () => {
    const { metadata } = await import('./page');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Terms of Service - Rehabify');
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
    expect(metadata.description.toLowerCase()).toContain('terms');
  });

  it('should render page component without errors', async () => {
    const TermsModule = await import('./page');
    const TermsPage = TermsModule.default;

    expect(TermsPage).toBeDefined();
    expect(typeof TermsPage).toBe('function');
  });

  it('should be a Server Component (no use client directive)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(__dirname, './page.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    expect(fileContent).not.toContain('"use client"');
    expect(fileContent).not.toContain("'use client'");
  });

  it('should contain Last Updated date and Medical Disclaimer section', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(__dirname, './page.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    expect(fileContent).toContain('Last Updated');
    expect(fileContent.toLowerCase()).toContain('medical disclaimer');
  });
});
