# prisma-runtime

Just the prisma runtime and a CLI tool to fix path.

This package do the following things:

- On Install: Create a prisma runtime (with the platform specific query engine binary)
- CLI Tool `prisma-runtime`: Fix the path to the prisma runtime and remove the generated one.

```sh
$ prisma-runtime --help
prisma-runtime: fix require/import path of prisma generated files in a directory
Options: -d, --dry    : dry run
         -h, --help   : show this help
         --no-fix-dts : do not fix d.ts exports
         --no-browser : remove index-browser.js
Example: prisma-runtime target/dir
```

```sh
$ prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (4.2.1 | library) to ./generated in 63ms
You can now start using Prisma Client in your code. Reference: https://pris.ly/d/client

import { PrismaClient } from './generated'
const prisma = new PrismaClient()

$ tree generated
generated
├── index-browser.js
├── index.d.ts
├── index.js
├── libquery_engine-darwin-arm64.dylib.node
├── package.json
├── runtime
│   ├── edge.js
│   ├── index-browser.d.ts
│   ├── index-browser.js
│   ├── index.d.ts
│   └── index.js
└── schema.prisma

1 directory, 11 files

$ prisma-runtime ./generated
Found 3 files:
- ./generated/index-browser.js
- ./generated/index.d.ts
- ./generated/index.js
Updated ./generated/index-browser.js
Updated ./generated/index.d.ts
Updated ./generated/index.js
Removed ./generated/runtime
Removed libquery_engine-darwin-arm64.dylib.node
DTS Patched ./generated/index.d.ts

$ tree generated 
generated
├── index-browser.js
├── index.d.ts
├── index.js
├── package.json
└── schema.prisma

0 directories, 5 files
```
