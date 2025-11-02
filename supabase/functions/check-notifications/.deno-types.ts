// Type declarations for Deno runtime (Supabase Edge Functions)
// These types are available at runtime but not in TypeScript compiler

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined
  }
  const env: Env
}

// Note: These are runtime types only - Supabase Edge Functions run in Deno
// TypeScript compiler warnings about Deno are expected and can be ignored

