from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Модель Book (Книга)
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    total_copies = db.Column(db.Integer, nullable=False)
    available_copies = db.Column(db.Integer, nullable=False)
    condition = db.Column(db.String(20), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'category': self.category,
            'total_copies': self.total_copies,
            'available_copies': self.available_copies,
            'condition': self.condition
        }

# Модель Reader (Читатель)
class Reader(db.Model):
    reader_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Изменено: Integer с автоинкрементом
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

# Модель Borrow (Выдача книги)
class Borrow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id', ondelete='CASCADE'), nullable=False)
    reader_id = db.Column(db.Integer, db.ForeignKey('reader.reader_id', ondelete='CASCADE'), nullable=False)  # Изменено: Integer
    borrow_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        book = Book.query.get(self.book_id)
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': book.title if book else 'Unknown',
            'book_author': book.author if book else 'Unknown',
            'reader_id': self.reader_id,
            'borrow_date': self.borrow_date.isoformat(),
            'due_date': self.due_date.isoformat()
        }