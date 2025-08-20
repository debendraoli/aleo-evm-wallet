const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'dist', 'cli.js');
if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const shebang = '#!/usr/bin/env node\n';
    if (!content.startsWith(shebang)) {
        fs.writeFileSync(file, shebang + content);
        fs.chmodSync(file, 0o755);
        console.log('Shebang added to dist/cli.js');
    }
}
