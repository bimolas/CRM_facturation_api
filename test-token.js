const http = require('http');

const body = JSON.stringify({
  company: {
    name: 'Test',
    ice: '001',
    rc: 'RC-1',
    taxIdentifier: 'IF-1',
    email: 'test@test.ma',
    physicalAddress: 'Address',
  },
  user: { email: 'admin@test.ma', password: 'Admin1234x', role: 'COMPANY_ADMIN' },
});

const req = http.request(
  { hostname: 'localhost', port: 3001, path: '/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => {
    let raw = '';
    res.on('data', (c) => (raw += c));
    res.on('end', () => {
      const parsed = JSON.parse(raw);
      console.log('Token payload:', Buffer.from(parsed.access_token.split('.')[1], 'base64').toString());
    });
  }
);
req.write(body);
req.end();
