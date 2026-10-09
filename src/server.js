const http = require('http');
const query = require('querystring');

const htmlHandler = require('./htmlResponses.js');
const responseHandler = require('./responses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
    '/': htmlHandler.getIndex,
    '/getBook': responseHandler.getBook,
    '/getBooks': responseHandler.getBooks,
    '/addBook': responseHandler.addBook,
    '/reviewBook': responseHandler.reviewBook,
    default: responseHandler.notFound
};

const parseBody = (request, response, handler) => {
    const body = [];

    request.on('error', (err) => {
        console.dir(err);
        response.statusCode = 400;
        response.end();
    });

    request.on('data', (data) => {
        body.push(data);
    });

    request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();
        const type = request.headers['content-type'];

        if (type === 'application/x-www-form-urlencoded') {
            request.body = query.parse(bodyString);
        } else if (type === 'application/json') {
            request.body = JSON.parse(bodyString);
        } else {
            response.writeHead(400, {'Content-Type': 'application/json'});
            response.write(JSON.stringify({message: 'invalid data format', id: 'invalidFormat'}));
            response.end();
        }

        handler(request, response);
    });
}

const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    const handler = urlStruct[parsedUrl.pathname];

    if (handler) {
        if (request.method === 'POST') {
            parseBody(request, response, handler);
        } else { //assume GET by default
            handler(request, response);
        }
    } else {
        urlStruct.default(request, response);
    }
}

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1:${port}`);
})