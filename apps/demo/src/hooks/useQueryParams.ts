import { useSearchParams } from 'react-router';

export function useQueryParams<T extends Record<string, string>>(): T {
  const [searchParams] = useSearchParams();

  return Object.fromEntries(searchParams.entries()) as T;
}
