import React, { useState } from 'react';
import { Book, Genre } from '../types';
import { GenreSelect } from './GenreSelect';


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
    image: null as File | null,
    available: false as boolean,
    rentMode: 'local' as 'local' | 'shipping',
    rentRegion: '' as string,
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

  const regionOptions: { value: string; label: string }[] = [
    { value: 'dolnośląskie', label: 'Dolnośląskie' },
    { value: 'kujawsko-pomorskie', label: 'Kujawsko‑pomorskie' },
    { value: 'lubelskie', label: 'Lubelskie' },
    { value: 'lubuskie', label: 'Lubuskie' },
    { value: 'łódzkie', label: 'Łódzkie' },
    { value: 'małopolskie', label: 'Małopolskie' },
    { value: 'mazowieckie', label: 'Mazowieckie' },
    { value: 'opolskie', label: 'Opolskie' },
    { value: 'podkarpackie', label: 'Podkarpackie' },
    { value: 'podlaskie', label: 'Podlaskie' },
    { value: 'pomorskie', label: 'Pomorskie' },
    { value: 'śląskie', label: 'Śląskie' },
    { value: 'świętokrzyskie', label: 'Świętokrzyskie' },
    { value: 'warmińsko-mazurskie', label: 'Warmińsko‑mazurskie' },
    { value: 'wielkopolskie', label: 'Wielkopolskie' },
    { value: 'zachodniopomorskie', label: 'Zachodniopomorskie' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : name === 'year'
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
      image: imagePreview || undefined,
      rent: formData.available,
      rentMode: formData.available ? formData.rentMode : undefined,
      rentRegion: formData.available && formData.rentMode === 'shipping' ? formData.rentRegion : undefined,
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
      image: null,
      available: false as boolean,
      rentMode: 'local' as 'local' | 'shipping',
      rentRegion: '' as string,
    });
    setImagePreview(null);
  };

  return (
    <div className="add-book-form">
      <h2 style={{ fontFamily: 'Spectral, serif' }}>Add new book</h2>
      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-group">
          <label htmlFor="title" style={{ fontFamily: 'Spectral, serif' }}>Title:</label>
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
          <label htmlFor="author" style={{ fontFamily: 'Spectral, serif' }}>Author:</label>
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
          <label htmlFor="year" style={{ fontFamily: 'Spectral, serif' }}>Year:</label>
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
          <label className="dropdown-label" htmlFor="genre" style={{ fontFamily: 'Spectral, serif' }}>Genre:</label>
          <GenreSelect
            value={formData.genre}
            onChange={(g) => setFormData(p => ({ ...p, genre: g }))}
            options={genreOptions}
          />
        </div>

        <div className="form-group">
          <label style={{ fontFamily: 'Spectral, serif' }}>Rating:</label>
          <div className="rating-table">
            {[1, 2, 3, 4, 5].map((i) => (
              <label
                key={i}
                className="rating-option"
                title={`${i} / 5`}
                onClick={() => setFormData(prev => ({ ...prev, rating: i }))}
              >
                <input
                  type="radio"
                  name="rating"
                  value={i}
                  checked={formData.rating === i}
                  onChange={handleInputChange}
                />
                <span
                  className={`book-emoji ${i <= (formData.rating ?? 0) ? 'active' : ''}`}
                  aria-hidden="true"
                  style={{ border: 'none' }}
                >
                ⭐
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
      <label htmlFor="description" style={{ fontFamily: 'Spectral, serif' }}>Description:</label>
          <textarea 
            style={{ fontFamily: 'Spectral, serif' }}
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
placeholder="Why you love or hate this book. Spill the tea."
          />
        </div>
        <div className="form-group">
  <label htmlFor="available" style={{ fontFamily: 'Spectral, serif' }}>Available for loan:</label>
  <label className="switch" htmlFor="available">
    <input
      id="available"
      name="available"
      type="checkbox"
      checked={formData.available}
      onChange={handleInputChange}
    />
    <span className="switch-track"><span className="switch-thumb" /></span>
  </label>
</div>
{formData.available && (
  <div className="form-group">
    <div className="loan-mode">
      <div className="switch-row">
        <span style={{ fontFamily: 'Spectral, serif' }}>Only local loan</span>
        <label className="switch" htmlFor="rentLocal">
          <input
            id="rentLocal"
            name="rentLocal"
            type="checkbox"
            checked={formData.rentMode === 'local'}
            onChange={() => setFormData(prev => ({ ...prev, rentMode: 'local' }))}
          />
          <span className="switch-track"><span className="switch-thumb" /></span>
        </label>
        {formData.rentMode === 'local' && (
      <div style={{ marginTop: 12 }}>
        <label style={{ fontFamily: 'Spectral, serif' }}>Region (Poland):</label>
        <GenreSelect
          value={formData.rentRegion}
          onChange={(r) => setFormData(p => ({ ...p, rentRegion: r }))}
          options={regionOptions}
        />
      </div>
    )}
      </div>
      <div className="switch-row" style={{ marginTop: 8 }}>
        <span style={{ fontFamily: 'Spectral, serif' }}>Shipping</span>
        <label className="switch" htmlFor="rentShipping">
          <input
            id="rentShipping"
            name="rentShipping"
            type="checkbox"
            checked={formData.rentMode === 'shipping'}
            onChange={() => setFormData(prev => ({ ...prev, rentMode: 'shipping' }))}
          />
          <span className="switch-track"><span className="switch-thumb" /></span>
        </label>
      </div>
    </div>
  </div>
)}

        <div className="form-group">
          <label htmlFor="image" style={{ fontFamily: 'Spectral, serif' }}  >Book image:</label>
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