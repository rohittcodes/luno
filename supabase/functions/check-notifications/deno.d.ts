/**
 * Deno global type declarations for TypeScript
 * This file provides type information for Deno-specific APIs used in Supabase Edge Functions
 * 
 * Note: These types are for TypeScript editor support only.
 * The code runs in Deno runtime where these APIs are available.
 */

declare global {
  // eslint-disable-next-line no-var
  var Deno: {
    env: {
      get(key: string): string | undefined
      set(key: string, value: string): void
      delete(key: string): void
      toObject(): Record<string, string>
    }
    version: {
      deno: string
      v8: string
      typescript: string
    }
    args: string[]
    build: {
      target: string
      arch: string
      os: string
      vendor: string
      env?: string
    }
    permissions: {
      request(desc: PermissionDescriptor): Promise<PermissionStatus>
      query(desc: PermissionDescriptor): Promise<PermissionStatus>
      revoke(desc: PermissionDescriptor): Promise<PermissionStatus>
    }
    mainModule: string
    exit(code?: number): never
    noColor: boolean
    isTty: {
      stdin: boolean
      stdout: boolean
      stderr: boolean
    }
    pid: number
    ppid: number
    cwd(): string
    chdir(directory: string | URL): void
    readTextFile(path: string | URL): Promise<string>
    readFile(path: string | URL): Promise<Uint8Array>
    writeTextFile(path: string | URL, data: string): Promise<void>
    writeFile(path: string | URL, data: Uint8Array): Promise<void>
    remove(path: string | URL): Promise<void>
    stat(path: string | URL): Promise<FileInfo>
    [key: string]: unknown
  }
}

// Additional type definitions for Deno HTTP server
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any
}

export {}

