export function useIsClient(): boolean {
  return typeof window !== 'undefined';
}
