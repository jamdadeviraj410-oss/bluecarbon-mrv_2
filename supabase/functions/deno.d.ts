// Ambient type declarations for Deno runtime in Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module 'https://*' {
  const content: any;
  export default content;
  export const createClient: any;
  export const ethers: any;
}
