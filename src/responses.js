const dataSet = require('../data/books.json');

const respond = (request, response, status, object) => {
    const content = JSON.stringify(object);
    response.writeHead(status, {'Content-Type': 'application/json'});
    response.write(content);
    response.end();
}

const parseRequest = (request, param) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const url = new URL(request.url, `${protocol}://${request.headers.host}`);

    return url.searchParams.get(param);
}

const getBook = (request, response) => {
    const title = parseRequest(request, 'title');
    console.log(title);

    //Return Bad Request error if missing title param
    if (!title) {
        return respond(request, response, 400, {message: 'Missing title query parameter', id: 'badRequest'});
    }

    const responseJSON = dataSet.filter(book => book.title === title);
    //console.log(responseJSON);

    //Return Not Found error if no book is found
    if (responseJSON.length === 0) {
        return respond(request, response, 404, {message: 'There are no books with this title', id: 'notFound'});
    }

    respond(request, response, 200, responseJSON);
}

const notFound = (request, response) => respond(request, response, 404, {message: "The resource you are looking for is not found", id: 'notFound'});

module.exports = {
    getBook,
    notFound,
};