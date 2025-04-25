const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.url.startsWith('/api/createuser')) {
    const parsedUrl = url.parse(req.url, true); // true => parse query string
    const user_id = parsedUrl.query.user_id;
    const user_name = parsedUrl.query.user_name;
    const gameid = parsedUrl.query.gameid;
    const serverName = parsedUrl.query.server;
    const distance = parsedUrl.query.distance;
    const random = crypto.randomInt(0, 20);

    // Generate a random string (16 bytes -> 32 characters) and slice it to 16 characters
    const token = crypto.randomBytes(143).toString('base64').replace(/\//g, '_').replace(/\+/g, '-').slice(random, 64 + random);

    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Read the existing file
    fs.readFile('tokens.json', 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // If the file doesn't exist, create a new one
          const newData = [{
            token: token, // Store the actual token here
            userid: user_id,
            username: user_name,
            gameid: gameid,
            server: serverName,
            distance: distance
          }];
          fs.writeFile('tokens.json', JSON.stringify(newData, null, 2), (err) => {
            if (err) throw err;
            console.log('New JSON file created with data!');
          });
        } else {
          throw err;
        }
      } else {
        // If the file exists, parse the data, add new entry and write back
        const existingData = JSON.parse(data);

        // Add the new token object to the existing data array
        existingData.push({
          token: token, // Store the actual token here
          userid: user_id,
          username: user_name,
          gameid: gameid,
          server: serverName,
          distance: distance
        });

        fs.writeFile('tokens.json', JSON.stringify(existingData, null, 2), (err) => {
          if (err) throw err;
          console.log('New data has been appended to the JSON file!');
        });
      }
    });

    res.end(JSON.stringify({ token: token }));
  } else if (req.url.startsWith('/api/gettoken')) {
    const parsedUrl = url.parse(req.url, true); // true => parse query string
    const token = parsedUrl.query.token;
    const data = fs.readFileSync('tokens.json', 'utf8');
    const tokens = JSON.parse(data);
    const tokenData = tokens.find(t => t.token === token);
    if (tokenData) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tokenData));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end("not found token");
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end("404 Not Found");
  }
});

server.listen(2000, '0.0.0.0', () => {
  console.log('Server running at http://0.0.0.0:2000/');
});
