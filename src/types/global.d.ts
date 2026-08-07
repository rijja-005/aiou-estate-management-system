declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'test' | 'production';
    DATABASE_URL?: string;
    DIRECT_DATABASE_URL?: string;
    AUTH_SECRET?: string;
    NEXT_PUBLIC_APP_NAME?: string;
  }
}
