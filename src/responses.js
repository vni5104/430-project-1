//Store imported data from books.json
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

//GET: Get Book Endpoint
const getBook = (request, response) => {
    const title = parseRequest(request, 'title');

    //Return Bad Request error if missing title param
    if (!title) {
        return respond(request, response, 400, {message: 'Missing title param', id: 'missingParams'});
    }

    const books = dataSet.filter(book => book.title === title);
    const responseJSON = {books};

    //Return Not Found error if no book is found
    if (books.length === 0) {
        return respond(request, response, 404, {message: 'There are no books with this title', id: 'notFound'});
    }

    //Return Success if corresponding book is found
    respond(request, response, 200, responseJSON);
};

//GET: Get Books Endpoint
const getBooks = (request, response) => {
    const author = parseRequest(request, 'author');
    const genre = parseRequest(request, 'genre');

    //Return Bad Request error if missing both author and genre params
    if (!author && !genre) {
        return respond(request, response, 400, {message: 'Missing author and genre param', id: 'missingParams'});
    }

    let books;
    if (author && genre) {
        books = dataSet.filter(book => {
            if (book.genres) {
                return book.author === author && book.genres.includes(genre);
            }
            return false;
        })
    } else if (author) {
        books = dataSet.filter(book => book.author === author);
    } else if (genre) {
        books = dataSet.filter(book => {
            if (book.genres) {
                return book.genres.includes(genre);
            }
            return false;
        })
    }

    //Return Not Found error if books are found with given params
    if (books.length === 0) {
        return respond(request, response, 404, {message: 'There are no books with this author and/or genre', id: 'notFound'});
    }

    //Return Success if there are corresponding books
    const responseJSON = {books};
    respond(request, response, 200, responseJSON);
}

//GET: Get All Books Endpoint
const getAllBooks = (request, response) => {
    //Return Not Found error if no books are found (unlikely)
    if (dataSet.length === 0) {
        return respond(request, response, 404, {message: 'There are no books in this API', id: 'notFound'});
    }

    //Return success if there are books found
    const books = dataSet;
    const responseJSON = {books};
    respond(request, response, 200, responseJSON);
};

//GET: Get Authors Endpoints
const getAuthors = (request, response) => {
    const country = parseRequest(request, 'country');
    const language = parseRequest(request, 'language');

    //Return Bad Request error if missing both country and language field
    if (!country && !language) {
        return respond(request, response, 400, {message: 'Missing country and language params', id: 'missingParams'});
    }

    let books;
    if (country && language) {
        books = dataSet.filter(book => {
            if (book.country && book.language) {
                return book.country === country && book.language === language
            }
            return false;
        });
    } else if (country) {
        books = dataSet.filter(book => {
            if (book.country) {
                return book.country === country;
            }
            return false;
        });
    } else if (language) {
        books = dataSet.filter(book => {
            if (book.language) {
                return book.language === language;
            }
            return false;
        });
    }

    //Return Not Found error if no authors were found
    if (books.length === 0) {
        return respond(request, response, 404, {message: 'No authors found', id: 'notFound'});
    }

    const authors = [];
    for (let i = 0; i < books.length; i++) {
        if (!authors.includes(books[i].author)) {
            authors.push(books[i].author);
        }
    }


    //Return Success if there are author(s) found
    const responseJSON = {authors: authors};
    respond(request, response, 200, responseJSON);
};

//POST: Add Book Endpoint
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
        title: title, year: year, genres: genres};

    //Return 204 Updated if book title and author already exists
    for (let i = 0; i < dataSet.length; i++) {
        if (dataSet[i].title === newData.title && dataSet[i].author === newData.author) {
            dataSet[i] = newData;

            return respond(request, response, 204, {book: newData});
        }
    }

    //Return 201 Created if book title and author didn't already exist
    dataSet.push(newData);
    responseJSON.message = 'Book successfully added';
    responseJSON.book = newData;
    respond(request, response, 201, responseJSON);
}

//POST: Review Book Endpoint
const reviewBook = (request, response) => {
    const responseJSON = {
        message: 'Missing required author and title params'
    };

    const {author, title, review} = request.body;

    //Return Bad Request error if missing both title or author param
    if (!title || !author) {
        responseJSON.id = 'missingParams';
        return respond(request, response, 400, responseJSON);
    }

    //Return Bad Request error if there is no review written
    if (!review) {
        responseJSON.message = 'Missing review for book';
        responseJSON.id = 'missingParams';
        return respond(request, response, 400, responseJSON);
    }

    //Return 204 Updated if a book with title and author is found
    //Updates corresponding book object with an added review property
    for (let i = 0; i < dataSet.length; i++) {
        if (dataSet[i].title === title && dataSet[i].author === author) {
            dataSet[i].review = review;
            responseJSON.message = 'Book review successfully added';
            responseJSON.book = {author: author, title: title, review: review};
            return respond(request, response, 204, responseJSON);
        }
    }

    //Return Not Found error if there isn't a book with title and author
    responseJSON.message = 'There is no book with the corresponding title and author';
    responseJSON.id = 'notFound';
    respond(request, response, 404, responseJSON);
};

const notFound = (request, response) => respond(request, response, 404, {message: "The resource you are looking for is not found", id: 'notFound'});

module.exports = {
    getBook,
    getBooks,
    getAllBooks,
    getAuthors,
    addBook,
    reviewBook,
    notFound,
};