/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_KEY: string;
    [key: string]: string | undefined;
  }
}
