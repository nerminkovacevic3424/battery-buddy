export const customColorPrice = 30;
export const normalizeColor = (value: unknown): string | null => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null;
