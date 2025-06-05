document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    fetchReaders();
    fetchHalls();
});

// Форма для создания зала
const addHallForm = document.getElementById('add-hall-form');
addHallForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('hall-name').value.trim();
    const specialization = document.getElementById('hall-specialization').value.trim();
    const library = document.getElementById('hall-library').value;
    const totalSeats = parseInt(document.getElementById('hall-total-seats').value);

    if (!name || !specialization || !totalSeats) {
        alert('Пожалуйста, заполните все обязательные поля: Название, Специализация, Количество мест.');
        return;
    }

    await addHall(name, specialization, library, totalSeats);
});

// Форма для добавления читателя в зал
const addReaderToHallForm = document.getElementById('add-reader-to-hall-form');
addReaderToHallForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hallId = parseInt(document.getElementById('hall-id-add-reader').value);
    const readerId = parseInt(document.getElementById('reader-id-add-hall').value);
    await addReaderToHall(hallId, readerId);
});

// Форма для удаления читателя из зала
const removeReaderFromHallForm = document.getElementById('remove-reader-from-hall-form');
removeReaderFromHallForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hallId = parseInt(document.getElementById('hall-id-remove-reader').value);
    const readerId = parseInt(document.getElementById('reader-id-remove-hall').value);
    await removeReaderFromHall(hallId, readerId);
});

// Форма для получения списка читателей в зале
const getHallReadersForm = document.getElementById('get-hall-readers-form');
getHallReadersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hallId = parseInt(document.getElementById('hall-id-readers').value);
    await fetchHallReaders(hallId);
});

// Форма добавления книги
const addBookForm = document.getElementById('add-book-form');
addBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const category = document.getElementById('book-category').value;
    const copies = parseInt(document.getElementById('book-copies').value);
    const condition = document.getElementById('book-condition').value;
    await addBook(title, author, category, copies, condition);
});

// Форма регистрации читателя
const addReaderForm = document.getElementById('add-reader-form');
addReaderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = document.getElementById('reader-first-name').value.trim();
    const lastName = document.getElementById('reader-last-name').value.trim();
    const patronymic = document.getElementById('reader-patronymic').value.trim();
    const ticketNumber = document.getElementById('reader-ticket-number').value.trim();
    const birthDate = document.getElementById('reader-birth-date').value;
    const phone = document.getElementById('reader-phone').value.trim();
    const education = document.getElementById('reader-education').value.trim();

    if (!firstName || !lastName || !ticketNumber || !birthDate || !phone) {
        alert('Пожалуйста, заполните все обязательные поля: Имя, Фамилия, Номер читательского билета, Дата рождения, Телефон.');
        return;
    }

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        alert('Дата рождения должна быть в формате YYYY-MM-DD (например, 1990-01-01).');
        return;
    }

    await addReader(firstName, lastName, patronymic, ticketNumber, birthDate, phone, education);
});

// Форма выдачи книги
const lendBookForm = document.getElementById('lend-book-form');
lendBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const readerId = parseInt(document.getElementById('lend-reader-id').value);
    const bookId = parseInt(document.getElementById('lend-book-id').value); // Теперь по ID
    await lendBook(readerId, bookId);
});

// Форма возврата книги
const returnBookForm = document.getElementById('return-book-form');
returnBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const readerId = parseInt(document.getElementById('return-reader-id').value);
    const bookId = parseInt(document.getElementById('return-book-id').value); // Теперь по ID
    await returnBook(readerId, bookId);
});

// Форма поиска книг
const searchBookForm = document.getElementById('search-book-form');
searchBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('search-title').value;
    const author = document.getElementById('search-author').value;
    const category = document.getElementById('search-category').value;
    await searchBooks(title, author, category);
});

// Форма удаления книги
const deleteBookForm = document.getElementById('delete-book-form');
deleteBookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const bookId = parseInt(document.getElementById('delete-book-id').value);
    await deleteBook(bookId);
});

// Форма удаления читателя
const deleteReaderForm = document.getElementById('delete-reader-form');
deleteReaderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const readerId = parseInt(document.getElementById('delete-reader-id').value);
    await deleteReader(readerId);
});

// Форма для получения списка книг читателя
const getBorrowedBooksForm = document.getElementById('get-borrowed-books-form');
getBorrowedBooksForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const readerId = parseInt(document.getElementById('borrowed-reader-id').value);
    await fetchBorrowedBooks(readerId);
});

// Получение списка залов
async function fetchHalls() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/halls');
        if (response.ok) {
            const halls = await response.json();
            console.log('Halls fetched:', halls);
            displayHalls(halls);
        } else {
            console.error('Failed to fetch halls:', response.status, response.statusText);
            alert(`Не удалось загрузить список залов: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error fetching halls:', error.message);
        alert(`Произошла ошибка при загрузке списка залов: ${error.message}`);
    }
}

// Отображение списка залов
function displayHalls(halls) {
    const hallsList = document.getElementById('halls-list');
    hallsList.innerHTML = '';
    halls.forEach(hall => {
        const li = document.createElement('li');
        li.textContent = 
            `ID:${'\u00A0'.repeat(10)}${hall.id}\n` +
            `Название:${'\u00A0'.repeat(10)}${hall.name}\n` +
            `Специализация:${'\u00A0'.repeat(10)}${hall.specialization}\n` +
            `Библиотека:${'\u00A0'.repeat(10)}${hall.library}\n` +
            `Места:${'\u00A0'.repeat(10)}${hall.occupied_seats}/${hall.total_seats} (свободно: ${hall.available_seats})\n` +
            `-------------------------------------------------------`;
        li.style.whiteSpace = 'pre-line';
        hallsList.appendChild(li);
    });
}

// Добавление зала
async function addHall(name, specialization, library, totalSeats) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/halls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, specialization, library, total_seats: totalSeats })
        });
        if (response.ok) {
            await fetchHalls();
            addHallForm.reset();
            alert('Зал успешно создан!');
        } else {
            const errorText = await response.text();
            console.error('Failed to add hall:', response.status, errorText);
            alert(`Не удалось создать зал: ${errorText}`);
        }
    } catch (error) {
        console.error('Error adding hall:', error.message);
        alert(`Произошла ошибка при создании зала: ${error.message}`);
    }
}

// Добавление читателя в зал
async function addReaderToHall(hallId, readerId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/halls/${hallId}/readers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reader_id: readerId })
        });
        if (response.ok) {
            await fetchHalls();
            addReaderToHallForm.reset();
            alert('Читатель успешно добавлен в зал!');
        } else {
            const errorText = await response.text();
            console.error('Failed to add reader to hall:', response.status, errorText);
            alert(`Не удалось добавить читателя в зал: ${errorText}`);
        }
    } catch (error) {
        console.error('Error adding reader to hall:', error.message);
        alert(`Произошла ошибка при добавлении читателя в зал: ${error.message}`);
    }
}

// Удаление читателя из зала
async function removeReaderFromHall(hallId, readerId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/halls/${hallId}/readers/${readerId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await fetchHalls();
            removeReaderFromHallForm.reset();
            alert('Читатель успешно удалён из зала!');
        } else {
            const errorText = await response.text();
            console.error('Failed to remove reader from hall:', response.status, errorText);
            alert(`Не удалось удалить читателя из зала: ${errorText}`);
        }
    } catch (error) {
        console.error('Error removing reader from hall:', error.message);
        alert(`Произошла ошибка при удалении читателя из зала: ${error.message}`);
    }
}

// Получение списка читателей в зале
async function fetchHallReaders(hallId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/halls/${hallId}/readers`);
        if (response.ok) {
            const readers = await response.json();
            console.log('Hall readers fetched:', readers);
            displayHallReaders(readers);
        } else {
            const errorText = await response.text();
            console.error('Failed to fetch hall readers:', response.status, errorText);
            alert(`Не удалось получить список читателей в зале: ${errorText}`);
        }
    } catch (error) {
        console.error('Error fetching hall readers:', error.message);
        alert(`Произошла ошибка при получении списка читателей в зале: ${error.message}`);
    }
}

// Отображение списка читателей в зале
function displayHallReaders(readers) {
    const hallReadersList = document.getElementById('hall-readers-list');
    hallReadersList.innerHTML = '';
    if (readers.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'В этом зале нет читателей.';
        hallReadersList.appendChild(li);
        return;
    }
    readers.forEach(reader => {
        const li = document.createElement('li');
        li.textContent = 
            `ID:${'\u00A0'.repeat(10)}${reader.reader_id}\n` +
            `Фамилия:${'\u00A0'.repeat(10)}${reader.last_name}\n` +
            `Имя:${'\u00A0'.repeat(10)}${reader.first_name}\n` +
            `Отчество:${'\u00A0'.repeat(10)}${reader.patronymic || 'не указано или отсутствует'}\n` + // Изменено
            `Номер читательского билета:${'\u00A0'.repeat(10)}${reader.ticket_number}\n` + // Изменено
            `Дата рождения:${'\u00A0'.repeat(10)}${reader.birth_date}\n` +
            `Телефон:${'\u00A0'.repeat(10)}${reader.phone}\n` +
            `Образование:${'\u00A0'.repeat(10)}${reader.education || 'не указано или отсутствует'}\n` + // Изменено
            `-------------------------------------------------------`;
        li.style.whiteSpace = 'pre-line';
        hallReadersList.appendChild(li);
    });
}

// Получение списка книг
async function fetchBooks() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/books');
        if (response.ok) {
            const books = await response.json();
            console.log('Books fetched:', books);
            displayBooks(books);
        } else {
            console.error('Failed to fetch books:', response.status, response.statusText);
            alert(`Не удалось загрузить список книг: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error fetching books:', error.message);
        alert(`Произошла ошибка при загрузке списка книг: ${error.message}`);
    }
}

// Отображение списка книг
function displayBooks(books) {
    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';
    books.forEach(book => {
        const li = document.createElement('li');
        li.textContent = 
            `ID:${'\u00A0'.repeat(10)}${book.id}\n` +
            `Название:${'\u00A0'.repeat(10)}${book.title}\n` +
            `Автор:${'\u00A0'.repeat(10)}${book.author}\n` +
            `Категория:${'\u00A0'.repeat(10)}${book.category}\n` +
            `Шифр:${'\u00A0'.repeat(10)}${book.unique_code}\n` +
            // Убрано: Копии:${'\u00A0'.repeat(10)}${book.available_copies}/${book.total_copies}\n` +
            `Состояние:${'\u00A0'.repeat(10)}${book.condition}\n` +
            `-------------------------------------------------------`;
        li.style.whiteSpace = 'pre-line';
        booksList.appendChild(li);
    });
}

// Добавление книги
async function addBook(title, author, category, copies, condition) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, category, total_copies: copies, available_copies: copies, condition })
        });
        if (response.ok) {
            await fetchBooks();
            addBookForm.reset();
            alert('Книга успешно добавлена!');
        } else {
            const errorText = await response.text();
            console.error('Failed to add book:', response.status, errorText);
            alert(`Не удалось добавить книгу: ${errorText}`);
        }
    } catch (error) {
        console.error('Error adding book:', error.message);
        alert(`Произошла ошибка при добавлении книги: ${error.message}`);
    }
}

// Получение списка читателей
async function fetchReaders() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/readers');
        if (response.ok) {
            const readers = await response.json();
            console.log('Readers fetched:', readers);
            displayReaders(readers);
        } else {
            console.error('Failed to fetch readers:', response.status, response.statusText);
            alert(`Не удалось загрузить список читателей: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error fetching readers:', error.message);
        alert(`Произошла ошибка при загрузке списка читателей: ${error.message}`);
    }
}

// Отображение списка читателей
function displayReaders(readers) {
    const readersList = document.getElementById('readers-list');
    readersList.innerHTML = '';
    if (readers.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Список читателей пуст.';
        readersList.appendChild(li);
        return;
    }
    readers.forEach(reader => {
        const li = document.createElement('li');
        li.textContent = 
            `ID:${'\u00A0'.repeat(10)}${reader.reader_id}\n` +
            `Фамилия:${'\u00A0'.repeat(10)}${reader.last_name}\n` +
            `Имя:${'\u00A0'.repeat(10)}${reader.first_name}\n` +
            `Отчество:${'\u00A0'.repeat(10)}${reader.patronymic || 'не указано или отсутствует'}\n` + // Изменено
            `Номер читательского билета:${'\u00A0'.repeat(10)}${reader.ticket_number}\n` + // Изменено
            `Дата рождения:${'\u00A0'.repeat(10)}${reader.birth_date}\n` +
            `Телефон:${'\u00A0'.repeat(10)}${reader.phone}\n` +
            `Образование:${'\u00A0'.repeat(10)}${reader.education || 'не указано или отсутствует'}\n` + // Изменено
            `-------------------------------------------------------`;
        li.style.whiteSpace = 'pre-line';
        readersList.appendChild(li);
    });
}

// Регистрация читателя
async function addReader(firstName, lastName, patronymic, ticketNumber, birthDate, phone, education) {
    try {
        const readerData = {
            first_name: firstName,
            last_name: lastName,
            patronymic: patronymic || null,
            ticket_number: ticketNumber,
            birth_date: birthDate,
            phone: phone,
            education: education || null
        };
        console.log('Sending reader data:', readerData);
        const response = await fetch('http://127.0.0.1:5000/api/readers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(readerData)
        });

        const responseText = await response.text();
        console.log('Server response:', response.status, responseText);

        if (response.ok) {
            const newReader = JSON.parse(responseText);
            console.log('New reader added:', newReader);
            await fetchReaders();
            addReaderForm.reset();
            alert('Читатель успешно добавлен!');
        } else {
            const errorData = JSON.parse(responseText);
            console.error('Failed to add reader:', response.status, errorData);
            alert(`Не удалось добавить читателя: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error adding reader:', error.message);
        alert(`Произошла ошибка при добавлении читателя: ${error.message}`);
    }
}

// Получение списка выданных книг
async function fetchBorrowedBooks(readerId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/readers/${readerId}/borrowed_books`);
        if (response.ok) {
            const borrowedBooks = await response.json();
            console.log('Borrowed books fetched:', borrowedBooks);
            displayBorrowedBooks(borrowedBooks);
        } else {
            const errorText = await response.text();
            console.error('Failed to fetch borrowed books:', response.status, errorText);
            alert(`Не удалось получить список выданных книг: ${errorText}`);
        }
    } catch (error) {
        console.error('Error fetching borrowed books:', error.message);
        alert(`Произошла ошибка при получении списка выданных книг: ${error.message}`);
    }
}

// Отображение списка выданных книг
function displayBorrowedBooks(borrowedBooks) {
    const borrowedBooksList = document.getElementById('borrowed-books-list');
    borrowedBooksList.innerHTML = '';
    if (borrowedBooks.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'У этого читателя нет выданных книг.';
        borrowedBooksList.appendChild(li);
        return;
    }
    borrowedBooks.forEach(borrow => {
        const li = document.createElement('li');
        li.textContent = 
            `ID читателя:${'\u00A0'.repeat(10)}${borrow.reader_id}\n` +
            `ID книги:${'\u00A0'.repeat(10)}${borrow.book_id}\n` + // Добавляем ID книги
            `Название:${'\u00A0'.repeat(10)}${borrow.book_title}\n` +
            `Автор:${'\u00A0'.repeat(10)}${borrow.book_author}\n` +
            `Шифр:${'\u00A0'.repeat(10)}${borrow.unique_code}\n` +
            `Дата выдачи:${'\u00A0'.repeat(10)}${new Date(borrow.borrow_date).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n` +
            `Срок возврата:${'\u00A0'.repeat(10)}${new Date(borrow.due_date).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n` +
            `-------------------------------------------------------`;
        li.style.whiteSpace = 'pre-line';
        borrowedBooksList.appendChild(li);
    });
}

// Выдача книги
async function lendBook(readerId, bookId) { // Теперь принимаем bookId
    try {
        const response = await fetch('http://127.0.0.1:5000/api/lend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reader_id: readerId, book_id: bookId }) // Изменено
        });
        if (response.ok) {
            await fetchBooks();
            await fetchReaders();
            lendBookForm.reset();
            alert('Книга успешно выдана!');
        } else {
            const errorText = await response.text();
            console.error('Failed to lend book:', response.status, errorText);
            alert(`Не удалось выдать книгу: ${errorText}`);
        }
    } catch (error) {
        console.error('Error lending book:', error.message);
        alert(`Произошла ошибка при выдаче книги: ${error.message}`);
    }
}

// Возврат книги
async function returnBook(readerId, bookId) { // Теперь принимаем bookId
    try {
        const response = await fetch('http://127.0.0.1:5000/api/return', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reader_id: readerId, book_id: bookId }) // Изменено
        });
        if (response.ok) {
            await fetchBooks();
            await fetchReaders();
            returnBookForm.reset();
            alert('Книга успешно возвращена!');
        } else {
            const errorText = await response.text();
            console.error('Failed to return book:', response.status, errorText);
            alert(`Не удалось вернуть книгу: ${errorText}`);
        }
    } catch (error) {
        console.error('Error returning book:', error.message);
        alert(`Произошла ошибка при возврате книги: ${error.message}`);
    }
}

// Поиск книг
async function searchBooks(title, author, category) {
    try {
        const query = new URLSearchParams();
        if (title) query.append('title', title);
        if (author) query.append('author', author);
        if (category) query.append('category', category);

        const response = await fetch(`http://127.0.0.1:5000/api/books/search?${query.toString()}`);
        if (response.ok) {
            const books = await response.json();
            console.log('Search results:', books);
            displayBooks(books);
        } else {
            const errorText = await response.text();
            console.error('Failed to search books:', response.status, errorText);
            alert(`Не удалось выполнить поиск книг: ${errorText}`);
        }
    } catch (error) {
        console.error('Error searching books:', error.message);
        alert(`Произошла ошибка при поиске книг: ${error.message}`);
    }
}

// Удаление книги
async function deleteBook(bookId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/books/${bookId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Книга успешно удалена!');
            await fetchBooks();
            deleteBookForm.reset();
        } else {
            const errorText = await response.text();
            console.error('Failed to delete book:', response.status, errorText);
            alert(`Не удалось удалить книгу: ${errorText}`);
        }
    } catch (error) {
        console.error('Error deleting book:', error.message);
        alert(`Произошла ошибка при удалении книги: ${error.message}`);
    }
}

// Удаление читателя
async function deleteReader(readerId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/readers/${readerId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Читатель успешно удалён!');
            await fetchReaders();
            await fetchHalls();
            deleteReaderForm.reset();
        } else {
            const errorText = await response.text();
            console.error('Failed to delete reader:', response.status, errorText);
            alert(`Не удалось удалить читателя: ${errorText}`);
        }
    } catch (error) {
        console.error('Error deleting reader:', error.message);
        alert(`Произошла ошибка при удалении читателя: ${error.message}`);
    }
}