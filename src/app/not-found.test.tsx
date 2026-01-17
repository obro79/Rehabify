import { describe, it, expect } from 'vitest';

describe('404 Not Found Page', () => {
  it('should export metadata with correct title and description', async () => {
    const { metadata } = await import('./not-found');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Page Not Found - Rehabify');
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
  });

  it('should render page component without errors', async () => {
    const NotFoundModule = await import('./not-found');
    const NotFound = NotFoundModule.default;

    expect(NotFound).toBeDefined();
    expect(typeof NotFound).toBe('function');
  });

  it('should be a Server Component (no use client directive)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.resolve(__dirname, './not-found.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    expect(fileContent).not.toContain('"use client"');
    expect(fileContent).not.toContain("'use client'");
  });
});
