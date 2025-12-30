declare const process: {
  env: {
    API_KEY: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_KEY: string;
    [key: string]: string | undefined;
  }
};
