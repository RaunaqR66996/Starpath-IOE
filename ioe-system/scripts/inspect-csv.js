const fs = require('fs');
const path = 'c:\\Users\\Raunaq\\Downloads\\StarPath-06\\DataCoSupplyChainDataset.csv';

const stream = fs.createReadStream(path, { encoding: 'latin1' });

let buffer = '';
stream.on('data', (chunk) => {
    buffer += chunk;
    if (buffer.includes('\n')) {
        const lines = buffer.split('\n');
        const headers = lines[0].split(',');
        console.log(headers.map((h, i) => `${i}: ${h}`).join('\n'));
        stream.destroy();
    }
});
