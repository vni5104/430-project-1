const dataSet = require('../data/books.json');

const respond = (request, response, status, object) => {
    const content = JSON.stringify(object);

    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8'),
    });

    if (request.method !== 'HEAD' && status != 204) {
        response.write(content);
    }
    
    response.end();
};

const parseRequest = (request, param) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const url = new URL(request.url, `${protocol}://${request.headers.host}`);

    return url.searchParams.get(param);
};

const getBook = (request, response) => {
    const title = parseRequest(request, 'title');
    console.log(title);

    //Return Bad Request error if missing title param
    if (!title) {
        return respond(request, response, 400, {message: 'Missing title param', id: 'missingParams'});
    }

    const responseJSON = dataSet.filter(book => book.title === title);
    //console.log(responseJSON);

    //Return Not Found error if no book is found
    if (responseJSON.length === 0) {
        return respond(request, response, 404, {message: 'There are no books with this title', id: 'notFound'});
    }

    respond(request, response, 200, responseJSON);
};

const addBook = (request, response) => {
    const responseJSON = {
        message: 'Missing required author and title params'
    };

    const {author, country, language, link, pages, title, year, genres} = request.body;
    
    //Return Bad Request error if missing title or author params
    if (!title || !author) {
        responseJSON.id = 'missingParams';
        return respond(request, response, 400, responseJSON);
    }

    const newData = {author: author, country: country, language: language, link: link, pages: pages,
        title: title, year: year, genres: genres
    };

    //Return 204 Updated if book title and author already exists
    for (let i = 0; i < dataSet.length; i++) {
        if (dataSet[i].title === newData.title && dataSet[i].author === newData.author) {
            dataSet[i] = newData;
            //console.log(dataSet[i]);
            //console.log(dataSet.length);

            return respond(request, response, 204, {});
        }
    }

    //Return 201 Created if book title and author didn't already exist
    dataSet.push(newData);
    responseJSON.message = 'Book successfully added';
    //console.log(dataSet[dataSet.length-1]);
    //console.log(dataSet.length);
    respond(request, response, 201, responseJSON);
}

const notFound = (request, response) => respond(request, response, 404, {message: "The resource you are looking for is not found", id: 'notFound'});

module.exports = {
    getBook,
    addBook,
    notFound,
};