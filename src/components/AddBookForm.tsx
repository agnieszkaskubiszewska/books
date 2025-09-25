import React, { useState } from 'react';
import { Book, Genre } from '../types';

interface AddBookFormProps {
  onAddBook: (book: Omit<Book, 'id'>) => void;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ onAddBook }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    genre: '' as Genre,
    rating: undefined as number | undefined,
    description: '',
    image: null as File | null
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const genreOptions = [
    { value: 'fantasy' as Genre, label: 'Fantasy' },
    { value: 'thriller' as Genre, label: 'Thriller' },
    { value: 'romance' as Genre, label: 'Romans' },
    { value: 'sci-fi' as Genre, label: 'Science Fiction' },
    { value: 'mystery' as Genre, label: 'Mystery' },
    { value: 'biography' as Genre, label: 'Biography' },
    { value: 'history' as Genre, label: 'History' },
    { value: 'other' as Genre, label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year'
        ? (parseInt(value) || new Date().getFullYear())
        : name === 'rating'
          ? (value ? parseInt(value) : undefined)
          : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.genre) {
      alert('Please fill all required fields');
      return;
    }

    const bookData: Omit<Book, 'id'> = {
      title: formData.title,
      author: formData.author,
      year: formData.year,
      genre: formData.genre,
      rating: formData.rating,
      description: formData.description,
      image: imagePreview || undefined
    };

    onAddBook(bookData);
    
    // Reset form
    setFormData({
      title: '',
      author: '',
      year: new Date().getFullYear(),
      genre: '' as Genre,
      rating: undefined,
      description: '',
      image: null
    });
    setImagePreview(null);
  };

  return (
    <div className="add-book-form">
      <h2>Add new book</h2>
      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            min="1900"
            max={new Date().getFullYear()}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Genre:</label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          >
            <option value="">Select genre</option>
            {genreOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Rating:</label>
          <div className="rating-table">
            {[1, 2, 3, 4, 5].map(rating => (
              <label key={rating} className="rating-option">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={formData.rating === rating}
                  onChange={handleInputChange}
                />
                <span>{rating}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Short book description..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Book image:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" className="submit-btn">
            Add book
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookForm; 