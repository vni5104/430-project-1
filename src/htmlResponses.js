const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const respond = (request, response, content, type) => {
    response.writeHead(200, {'Content-Type': type});
    response.write(content);
    response.end();
}

const getIndex = (request, response) => respond(request, response, index, 'text/html');

module.exports = {
    getIndex,
};