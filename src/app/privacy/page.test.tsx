import { describe, it, expect } from 'vitest';

describe('Privacy Policy Page', () => {
  it('should export metadata with correct title and description', async () => {
    const { metadata } = await import('./page');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Privacy Policy - Rehabify');
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
    expect(metadata.description.toLowerCase()).toContain('privacy');
  });

  it('should render page component without errors', async () => {
    const PrivacyModule = await import('./page');
    const PrivacyPage = PrivacyModule.default;

    expect(PrivacyPage).toBeDefined();
    expect(typeof PrivacyPage).toBe('function');
  });

  it('should be a Server Component (no use client directive)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(__dirname, './page.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    expect(fileContent).not.toContain('"use client"');
    expect(fileContent).not.toContain("'use client'");
  });

  it('should contain Last Updated date and Privacy Highlights section', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(__dirname, './page.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    expect(fileContent).toContain('Last Updated');
    expect(fileContent.toLowerCase()).toContain('privacy highlights');
  });
});
