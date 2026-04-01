import path from 'node:path'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'

async function generateDeclaration({
  target,
  external,
  fileName,
}: {
  target: string
  external?: string[]
  fileName: string
}) {
  const bundle = await rollup({
    input: path.join('packages', target, 'src', 'index.ts'),
    external,
    plugins: [
      typescript({
        tsconfig: 'tsconfig.build.json',
        compilerOptions: {
          rootDir: path.join('packages', target, 'src'),
          declarationDir: path.join('packages', target, 'dist'),
        },
      }),
    ],
  })
  await bundle.write({
    dir: path.join('packages', target, 'dist'),
    format: 'es',
  })

  const dtsBundle = await rollup({
    input: path.join('packages', target, 'dist', 'index.d.ts'),
    external,
    plugins: [dts()],
  })
  await dtsBundle.write({
    file: path.join('packages', target, 'dist', fileName),
    format: 'es',
  })

  const removals = []
  for (const file of fs.readdirSync(path.join('packages', target, 'dist'))) {
    if (file === fileName) continue
    removals.push(fs.remove(path.join('packages', target, 'dist', file)))
  }

  await Promise.all(removals)
}

async function generateCode({
  target,
  minify,
  external,
  replaces,
  fileName,
  format,
}: {
  target: string
  minify: boolean
  external?: string[]
  replaces: Record<string, string>
  fileName: string
  format: 'es' | 'cjs'
}) {
  const bundle = await rollup({
    input: path.join('packages', target, 'src', 'index.ts'),
    external,
    plugins: [
      minify &&
        terser({
          compress: {
            ecma: 2016,
            pure_getters: true,
          },
          format: {
            // Remove comments for tests
            comments: /^!/,
          },
        }),
      typescript({
        tsconfig: 'tsconfig.build.json',
        compilerOptions: {
          declaration: false,
          isolatedDeclarations: false,
        },
      }),
      replace({ values: replaces, preventAssignment: true }),
      resolve(),
    ].filter(Boolean),
  })
  const { version } = JSON.parse(
    await fs.readFile(path.resolve('packages', target, 'package.json'), 'utf8'),
  )
  const banner = await fs.readFile(
    path.resolve('packages', target, '.banner'),
    'utf8',
  )
  await bundle.write({
    file: path.join('packages', target, 'dist', fileName),
    banner: banner.trim().replace('$version', version),
    format,
  })
}

async function buildRezor() {
  const target = 'react'

  await fs.remove(path.join('packages', target, 'dist'))

  await generateDeclaration({
    target,
    fileName: 'index.d.ts',
  })

  await generateCode({
    target,
    minify: false,
    replaces: {
      __DEV__: 'true',
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    fileName: 'index.cjs.js',
    format: 'cjs',
  })

  await generateCode({
    target,
    minify: true,
    replaces: {
      __DEV__: 'false',
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    fileName: 'index.cjs.prod.js',
    format: 'cjs',
  })

  await generateCode({
    target,
    minify: false,
    replaces: {
      __DEV__: `(process.env.NODE_ENV !== 'production')`,
    },
    fileName: 'index.esm-bundler.js',
    format: 'es',
  })
}

// @ts-expect-error
await buildRezor()
