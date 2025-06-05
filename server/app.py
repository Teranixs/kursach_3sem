from flask import Flask, jsonify, request, abort
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta, date
import os
import logging
from uuid import uuid4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, '../database/library.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

def get_moscow_time():
    return datetime.utcnow() + timedelta(hours=3)

hall_readers = db.Table('hall_readers',
    db.Column('hall_id', db.Integer, db.ForeignKey('hall.id'), primary_key=True),
    db.Column('reader_id', db.Integer, db.ForeignKey('reader.reader_id'), primary_key=True)
)

class Hall(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # Отключаем автоинкремент
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    library = db.Column(db.String(50), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    readers = db.relationship('Reader', secondary=hall_readers, backref=db.backref('halls', lazy='dynamic'))

    def occupied_seats(self):
        return len(self.readers)

    def available_seats(self):
        return self.total_seats - self.occupied_seats()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'specialization': self.specialization,
            'library': self.library,
            'total_seats': self.total_seats,
            'occupied_seats': self.occupied_seats(),
            'available_seats': self.available_seats()
        }

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # Отключаем автоинкремент
    title = db.Column(db.String(100), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    total_copies = db.Column(db.Integer, nullable=False)
    available_copies = db.Column(db.Integer, nullable=False)
    condition = db.Column(db.String(20), nullable=False)
    unique_code = db.Column(db.String(36), nullable=False, unique=True, default=lambda: str(uuid4()))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'category': self.category,
            'total_copies': self.total_copies,
            'available_copies': self.available_copies,
            'condition': self.condition,
            'unique_code': self.unique_code
        }

class Reader(db.Model):
    reader_id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # Отключаем автоинкремент
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    patronymic = db.Column(db.String(100), nullable=True)
    ticket_number = db.Column(db.String(50), nullable=False, unique=True)
    birth_date = db.Column(db.Date, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    education = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'reader_id': self.reader_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'patronymic': self.patronymic,
            'ticket_number': self.ticket_number,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'phone': self.phone,
            'education': self.education
        }

class Borrow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id', ondelete='CASCADE'), nullable=False)
    reader_id = db.Column(db.Integer, db.ForeignKey('reader.reader_id', ondelete='CASCADE'), nullable=False)
    borrow_date = db.Column(db.DateTime, nullable=False, default=get_moscow_time)
    due_date = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        book = Book.query.get(self.book_id)
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': book.title if book else 'Unknown',
            'book_author': book.author if book else 'Unknown',
            'unique_code': book.unique_code if book else 'Unknown',
            'reader_id': self.reader_id,
            'borrow_date': self.borrow_date.isoformat(),
            'due_date': self.due_date.isoformat()
        }

# Функция для нахождения минимального свободного ID
def find_min_free_id(model, id_column):
    existing_ids = [getattr(item, id_column) for item in model.query.all()]
    if not existing_ids:
        return 1
    existing_ids.sort()
    for i in range(1, len(existing_ids) + 2):
        if i not in existing_ids:
            return i
    return max(existing_ids) + 1

@app.errorhandler(400)
def bad_request(error):
    logger.error(f"Bad request: {str(error)}")
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

@app.route('/api/halls', methods=['POST'])
def create_hall():
    data = request.get_json()
    logger.info(f"Received hall data: {data}")
    required_fields = ['name', 'specialization', 'library', 'total_seats']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        logger.error(f"Missing required fields: {missing_fields}")
        abort(400, description=f"Missing required fields: {', '.join(missing_fields)}")

    valid_libraries = ['Общая', 'Физико-Математическая', 'Гуманитарная', 'Историческая']
    if data['library'] not in valid_libraries:
        logger.error(f"Invalid library: {data['library']}")
        abort(400, description=f"Library must be one of: {', '.join(valid_libraries)}")

    total_seats = int(data['total_seats'])
    if total_seats <= 0:
        logger.error("Total seats must be positive")
        abort(400, description="Total seats must be a positive number")

    # Находим минимальный свободный ID
    new_id = find_min_free_id(Hall, 'id')

    new_hall = Hall(
        id=new_id,
        name=data['name'],
        specialization=data['specialization'],
        library=data['library'],
        total_seats=total_seats
    )
    db.session.add(new_hall)
    try:
        db.session.commit()
        logger.info(f"Hall created: {new_hall.name} with ID {new_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating hall: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify(new_hall.to_dict()), 201

@app.route('/api/halls', methods=['GET'])
def get_halls():
    halls = Hall.query.all()
    logger.info(f"Fetched {len(halls)} halls")
    return jsonify([hall.to_dict() for hall in halls])

@app.route('/api/halls/<int:hall_id>/readers', methods=['GET'])
def get_hall_readers(hall_id):
    hall = Hall.query.get(hall_id)
    if not hall:
        abort(404, description="Hall not found")
    logger.info(f"Fetched readers for hall ID {hall_id}")
    return jsonify([reader.to_dict() for reader in hall.readers])

@app.route('/api/halls/<int:hall_id>/books/author', methods=['GET'])
def count_author_books_in_hall(hall_id):
    hall = Hall.query.get(hall_id)
    if not hall:
        abort(404, description="Hall not found")

    author = request.args.get('author', '')
    if not author:
        abort(400, description="Author name is required")

    readers = hall.readers
    reader_ids = [reader.reader_id for reader in readers]
    borrowed_books = Borrow.query.filter(Borrow.reader_id.in_(reader_ids)).all()
    book_ids = [borrow.book_id for borrow in borrowed_books]
    books = Book.query.filter(Book.id.in_(book_ids), Book.author.ilike(f'%{author}%')).all()
    count = len(books)

    logger.info(f"Counted {count} books by author '{author}' in hall ID {hall_id}")
    return jsonify({'count': count})

@app.route('/api/halls/<int:hall_id>/readers', methods=['POST'])
def add_reader_to_hall(hall_id):
    data = request.get_json()
    logger.info(f"Received data to add reader to hall: {data}")
    if 'reader_id' not in data:
        abort(400, description="Missing 'reader_id' in request")

    hall = Hall.query.get(hall_id)
    if not hall:
        abort(404, description="Hall not found")

    reader = Reader.query.get(data['reader_id'])
    if not reader:
        abort(404, description="Reader not found")

    if reader in hall.readers:
        abort(400, description="Reader is already in this hall")

    if hall.occupied_seats() >= hall.total_seats:
        abort(400, description="No available seats in this hall")

    for other_hall in reader.halls:
        reader.halls.remove(other_hall)
    hall.readers.append(reader)

    try:
        db.session.commit()
        logger.info(f"Reader ID {reader.reader_id} added to hall ID {hall_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding reader to hall: {str(e)}")
        abort(500, description=str(e))

    return jsonify(hall.to_dict()), 200

@app.route('/api/halls/<int:hall_id>/readers/<int:reader_id>', methods=['DELETE'])
def remove_reader_from_hall(hall_id, reader_id):
    hall = Hall.query.get(hall_id)
    if not hall:
        abort(404, description="Hall not found")

    reader = Reader.query.get(reader_id)
    if not reader:
        abort(404, description="Reader not found")

    if reader not in hall.readers:
        abort(400, description="Reader is not in this hall")

    hall.readers.remove(reader)
    try:
        db.session.commit()
        logger.info(f"Reader ID {reader_id} removed from hall ID {hall_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error removing reader from hall: {str(e)}")
        abort(500, description=str(e))

    return jsonify(hall.to_dict()), 200

@app.route('/api/books', methods=['POST'])
def create_book():
    data = request.get_json()
    logger.info(f"Received book data: {data}")
    if not data or 'title' not in data or 'author' not in data or 'category' not in data or 'total_copies' not in data:
        abort(400, description="Missing required fields: 'title', 'author', 'category', or 'total_copies'")

    total_copies = data['total_copies']
    books = []
    for _ in range(total_copies):
        # Находим минимальный свободный ID для каждой книги
        new_id = find_min_free_id(Book, 'id')
        new_book = Book(
            id=new_id,
            title=data['title'],
            author=data['author'],
            category=data['category'],
            total_copies=1,
            available_copies=1,
            condition=data.get('condition', 'good'),
            unique_code=str(uuid4())
        )
        books.append(new_book)
        db.session.add(new_book)

    try:
        db.session.commit()
        logger.info(f"Books created: {data['title']} (x{total_copies})")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating book: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify([book.to_dict() for book in books]), 201

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    logger.info(f"Fetched {len(books)} books")
    return jsonify([book.to_dict() for book in books])

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        abort(404, description="Book not found")
    
    if book.available_copies != book.total_copies:
        abort(400, description="Cannot delete book: it is currently borrowed")
    
    try:
        db.session.delete(book)
        db.session.commit()
        logger.info(f"Book deleted: {book.title}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting book: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify({'message': 'Book deleted successfully'}), 200

@app.route('/api/books/search', methods=['GET'])
def search_books():
    title = request.args.get('title', '')
    author = request.args.get('author', '')
    category = request.args.get('category', '')

    query = Book.query
    if title:
        query = query.filter(Book.title.ilike(f'%{title}%'))
    if author:
        query = query.filter(Book.author.ilike(f'%{author}%'))
    if category:
        query = query.filter(Book.category.ilike(f'%{category}%'))

    books = query.all()
    logger.info(f"Found {len(books)} books by search criteria")
    return jsonify([book.to_dict() for book in books])

@app.route('/api/readers', methods=['POST'])
def create_reader():
    data = request.get_json()
    logger.info(f"Received reader data: {data}")
    required_fields = ['first_name', 'last_name', 'ticket_number', 'birth_date', 'phone']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        logger.error(f"Missing required fields: {missing_fields}")
        abort(400, description=f"Missing required fields: {', '.join(missing_fields)}")

    ticket_number = data['ticket_number']
    logger.info(f"Checking ticket number: {ticket_number}")
    if Reader.query.filter_by(ticket_number=ticket_number).first():
        logger.error(f"Ticket number {ticket_number} already exists")
        abort(400, description="Reader with this ticket number already exists")

    try:
        birth_date_str = data['birth_date']
        logger.info(f"Parsing birth date: {birth_date_str}")
        if not birth_date_str:
            logger.error("Birth date is empty")
            abort(400, description="Birth date cannot be empty")
        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        logger.info(f"Parsed birth date: {birth_date}")
    except ValueError as e:
        logger.error(f"Invalid date format: {str(e)}")
        abort(400, description="Invalid date format for birth_date. Use YYYY-MM-DD")

    # Находим минимальный свободный ID
    new_id = find_min_free_id(Reader, 'reader_id')

    try:
        new_reader = Reader(
            reader_id=new_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            patronymic=data.get('patronymic', None),
            ticket_number=ticket_number,
            birth_date=birth_date,
            phone=data['phone'],
            education=data.get('education', None)
        )
        logger.info(f"Adding reader: {new_reader.first_name} {new_reader.last_name} with ID {new_id}")
        db.session.add(new_reader)
        db.session.commit()
        logger.info(f"Reader created: {new_reader.first_name} {new_reader.last_name}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating reader: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify(new_reader.to_dict()), 201

@app.route('/api/readers', methods=['GET'])
def get_readers():
    readers = Reader.query.all()
    logger.info(f"Fetched {len(readers)} readers")
    return jsonify([reader.to_dict() for reader in readers])

@app.route('/api/readers/<int:reader_id>', methods=['DELETE'])
def delete_reader(reader_id):
    reader = Reader.query.get(reader_id)
    if not reader:
        abort(404, description="Reader not found")

    borrowed_books = Borrow.query.filter_by(reader_id=reader_id).all()
    if borrowed_books:
        abort(400, description="Cannot delete reader: they have borrowed books")

    for hall in reader.halls:
        reader.halls.remove(hall)

    try:
        db.session.delete(reader)
        db.session.commit()
        logger.info(f"Reader deleted: {reader.first_name} {reader.last_name}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting reader: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify({'message': 'Reader deleted successfully'}), 200

@app.route('/api/readers/<int:reader_id>/borrowed_books', methods=['GET'])
def get_borrowed_books(reader_id):
    reader = Reader.query.get(reader_id)
    if not reader:
        abort(404, description="Reader not found")

    borrowed_books = Borrow.query.filter_by(reader_id=reader_id).all()
    logger.info(f"Fetched {len(borrowed_books)} borrowed books for reader ID {reader_id}")
    return jsonify([borrow.to_dict() for borrow in borrowed_books])

@app.route('/api/lend', methods=['POST'])
def lend_book():
    data = request.get_json()
    logger.info(f"Received lend data: {data}")
    if not data or 'reader_id' not in data or 'book_id' not in data:
        abort(400, description="Missing 'reader_id' or 'book_id' in request")

    reader_id = data['reader_id']
    book_id = data['book_id']

    reader = Reader.query.get(reader_id)
    if not reader:
        abort(404, description="Reader not found")

    book = Book.query.get(book_id)
    if not book:
        abort(404, description="Book not found")

    if book.available_copies <= 0:
        abort(400, description="No available copies of this book")

    existing_borrow = Borrow.query.filter_by(reader_id=reader_id, book_id=book.id).first()
    if existing_borrow:
        abort(400, description="Reader has already borrowed this book")

    due_date = get_moscow_time().replace(microsecond=0) + timedelta(days=14)
    new_borrow = Borrow(book_id=book.id, reader_id=reader_id, due_date=due_date)
    book.available_copies -= 1

    db.session.add(new_borrow)
    try:
        db.session.commit()
        logger.info(f"Book lent: {book.title} to reader ID {reader_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error lending book: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify(new_borrow.to_dict()), 201

@app.route('/api/return', methods=['POST'])
def return_book():
    data = request.get_json()
    logger.info(f"Received return data: {data}")
    if not data or 'reader_id' not in data or 'book_id' not in data:
        abort(400, description="Missing 'reader_id' or 'book_id' in request")

    reader_id = data['reader_id']
    book_id = data['book_id']

    reader = Reader.query.get(reader_id)
    if not reader:
        abort(404, description="Reader not found")

    book = Book.query.get(book_id)
    if not book:
        abort(404, description="Book not found")

    borrow = Borrow.query.filter_by(reader_id=reader_id, book_id=book.id).first()
    if not borrow:
        abort(400, description="This book was not borrowed by this reader")

    book.available_copies += 1
    db.session.delete(borrow)
    try:
        db.session.commit()
        logger.info(f"Book returned: {book.title} by reader ID {reader_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error returning book: {str(e)}")
        abort(500, description=str(e))
    
    return jsonify({'message': 'Book returned successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)