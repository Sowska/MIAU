const dns = require('node:dns').promises;

async function test() {
  try {
    const result = await dns.resolveSrv(
      '_mongodb._tcp.miau.mthihlz.mongodb.net'
    );

    console.log(result);
  } catch (err) {
    console.error(err);
  }
}

test();