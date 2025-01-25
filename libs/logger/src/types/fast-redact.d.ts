declare module 'fast-redact' {
  interface FastRedactOptions {
    paths: string[];
    censor?: string;
    strict?: boolean;
    serialize?: boolean;
  }

  type FastRedact = (options: FastRedactOptions) => (obj: any) => string;

  const fastRedact: FastRedact;
  export default fastRedact;
}
