if (process.platform !== 'linux') {
  console.error([
    'Visual baselines are canonical on Linux.',
    'Run this command in a Linux environment or use the Visual CI job.',
    'Review the page itself in your local browser instead of creating a macOS baseline.'
  ].join('\n'));
  process.exit(1);
}
