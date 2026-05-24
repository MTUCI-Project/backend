const { spawnSync } = require('child_process');
const path = require('path');

const composeFile = path.join('docker', 'docker-compose.dev.yml');

console.log('Starting Docker services...');

const result = spawnSync('docker', ['compose', '-f', composeFile, 'up', '-d'], {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
