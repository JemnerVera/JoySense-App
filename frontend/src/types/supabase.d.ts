declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      rol?: string;
      usuarioid?: any;
    };
  }

  export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
  }

  export interface AuthResponse {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: any;
  }

  export interface QueryBuilder {
    select: (columns: string) => QueryBuilder;
    eq: (column: string, value: any) => QueryBuilder;
    single: () => Promise<{ data: any; error: any }>;
  }

  export interface SupabaseClient {
    auth: {
      signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
      signOut: () => Promise<{ error: any }>;
      onAuthStateChange: (callback: (event: string, session: Session | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
      getSession: () => Promise<{ data: { session: Session | null }; error: any }>;
      getUser: () => Promise<{ data: { user: User | null }; error: any }>;
    };
    from: (table: string) => QueryBuilder;
  }

  export function createClient(url: string, key: string): SupabaseClient;
}
