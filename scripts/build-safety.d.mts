/** Types for build-safety.mjs (imported by vite.config.ts). */
export declare const PRODUCTION_API_URL: string
export declare const UNCHECKED_MODES: string[]
export declare function isProductionBuild(command: string, mode: string): boolean
export declare function checkProductionEnv(env: Record<string, string | undefined>): string[]
export declare function checkBundleCode(code: string): string[]
export declare function describeProblems(heading: string, problems: string[]): string
