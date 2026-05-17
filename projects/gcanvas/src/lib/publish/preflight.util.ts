import { CanvasData } from '../models/canvas-data.model';

export interface PreflightResult {
  id: string;           // machine key, e.g. 'missing-alt'
  label: string;        // human-readable short label
  severity: 'error' | 'warning';
  detail?: string;      // optional additional context
}

export function checkImageAlt(data: CanvasData): PreflightResult[] {
  const results: PreflightResult[] = [];
  for (const el of data.elements) {
    if (el.type === 'image') {
      const alt = (el as any).alt as string | undefined;
      if (!alt) {
        results.push({
          id: 'missing-alt',
          label: 'Missing image alt text',
          severity: 'warning',
        });
      }
    }
  }
  return results;
}

export function checkSeoTitle(data: CanvasData): PreflightResult[] {
  if (!data.meta?.seoTitle) {
    return [
      {
        id: 'missing-seo-title',
        label: 'Missing SEO title',
        severity: 'warning',
      },
    ];
  }
  return [];
}

export function checkSeoDescription(data: CanvasData): PreflightResult[] {
  if (!data.meta?.seoDescription) {
    return [
      {
        id: 'missing-seo-desc',
        label: 'Missing SEO description',
        severity: 'warning',
      },
    ];
  }
  return [];
}

export function runPreflightChecks(data: CanvasData): PreflightResult[] {
  return [
    ...checkImageAlt(data),
    ...checkSeoTitle(data),
    ...checkSeoDescription(data),
  ];
}
