const build = async () => {
  // Build with Bun
  await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    minify: true,
    sourcemap: 'external',
    target: 'node',
    define: {
      'process.env.FORCE_COLOR': 'true',
    },
  });

  // Generate d.ts files using tsc
  const proc = Bun.spawn(
    ['tsc', '--emitDeclarationOnly', '--declaration', '--project', 'tsconfig.json'],
    {
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );

  await proc.exited;
};

build()
  .then(() => {
    console.log('Build completed');
  })
  .catch((error) => {
    console.error('Build failed', error);
  });
