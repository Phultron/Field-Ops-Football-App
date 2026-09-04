// `output: "standalone"` is required for Docker/SPCS deployment, but it is
// incompatible with Vercel's own build system (Vercel does its own serverless
// bundling and expects Next's default output format). Vercel sets VERCEL=1
// during builds, so skip `standalone` only there.
// `images.unoptimized` avoids needing the sharp package.
//
// `turbopack.root` and `outputFileTracingRoot` are pinned to this app's
// own directory because Next.js 16 + Turbopack walks upward looking for
// a lockfile and silently re-roots the project if it finds one in a
// parent directory. Symptoms when this re-roots are nasty: `/` returns
// 404, chunk URLs contain the wrong path prefix, and
// `outputFileTracingRoot` is wrong at deploy time. Keeping these
// pinned to `__dirname` is the only reliable fix; do NOT remove them
// when adding new config.

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
