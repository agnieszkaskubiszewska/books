document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    let books = [
        {
            title: 'Przykładowa książka 1',
            author: 'Jan Kowalski',
            year: 2023,
            genre: 'fantasy',
            rating: 4,
            description: 'Przykładowy opis książki'
        },
        {
            title: 'Przykładowa książka 2',
            author: 'Anna Nowak',
            year: 2022,
            genre: 'thriller',
            rating: 5,
            description: 'Kolejny przykładowy opis'
        }
    ];
    
    const menuButton = document.querySelector('.menu-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    function toggleMenu() {
        menuButton.classList.toggle('active');
        dropdownMenu.classList.toggle('active');
    }
    
    function showNotification(message) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
    
    function renderBooks() {
        const booksList = document.querySelector('.books-list');
        if (booksList) {
            booksList.innerHTML = '';
            
            books.forEach((book, index) => {
                const bookItem = document.createElement('div');
                bookItem.className = 'book-item';
                bookItem.innerHTML = `
                    ${book.image ? `<div class="book-image-container"><img src="${book.image}" alt="${book.title}" class="book-image"></div>` : ''}
                    <h3>${book.title}</h3>
                    <p><strong>Autor:</strong> ${book.author}</p>
                    <p><strong>Rok wydania:</strong> ${book.year}</p>
                    <p><strong>Gatunek:</strong> ${getGenreName(book.genre)}</p>
                    ${book.rating ? `<p><strong>Ocena:</strong> ${'⭐'.repeat(book.rating)} (${book.rating}/5)</p>` : ''}
                    ${book.description ? `<p><strong>Opis:</strong> ${book.description}</p>` : ''}
                    <button class="delete-book-btn" data-index="${index}">Usuń</button>
                `;
                booksList.appendChild(bookItem);
            });
            
            document.querySelectorAll('.delete-book-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    deleteBook(index);
                });
            });
        }
    }
    
    function deleteBook(index) {
        if (confirm(`Czy na pewno chcesz usunąć książkę "${books[index].title}"?`)) {
            books.splice(index, 1);
            renderBooks();
            showNotification('Książka została usunięta!');
        }
    }
    
    function getGenreName(genreCode) {
        const genres = {
            'fantasy': 'Fantasy',
            'thriller': 'Thriller',
            'romance': 'Romans',
            'sci-fi': 'Science Fiction',
            'mystery': 'Kryminał',
            'biography': 'Biografia',
            'history': 'Historyczna',
            'other': 'Inne'
        };
        return genres[genreCode] || genreCode;
    }
    
    menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
        showNotification('Menu zostało otwarte!');
    });

    const addNewBookBtn = document.querySelector('#addNewBookBtn');
    if(addNewBookBtn) {
        addNewBookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Kliknięto: dodaj nową książkę');
            showNotification('Otwieranie formularza...');
            const addNewBookForm = document.querySelector('#addNewBookForm');
            if(addNewBookForm) {
                addNewBookForm.style.display = 'block';
            }
        });
    }
    
    const cancelBookBtn = document.querySelector('#cancelBookBtn');
    if(cancelBookBtn) {
        cancelBookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const addNewBookForm = document.querySelector('#addNewBookForm');
            if(addNewBookForm) {
                addNewBookForm.style.display = 'none';
                document.getElementById('bookForm').reset();
                showNotification('Formularz został anulowany');
            }
        });
    }
    
    const bookForm = document.querySelector('#bookForm');
    if(bookForm) {
        bookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const imageFile = document.getElementById('bookImage').files[0];
            
            const bookData = {
                title: formData.get('bookTitle'),
                author: formData.get('bookAuthor'),
                year: parseInt(formData.get('bookYear')),
                genre: formData.get('bookGenre'),
                rating: formData.get('bookRating') ? parseInt(formData.get('bookRating')) : null,
                description: formData.get('bookDescription'),
                image: null
            };
            
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    bookData.image = e.target.result;
                    addBookToArray(bookData);
                };
                reader.readAsDataURL(imageFile);
            } else {
                addBookToArray(bookData);
            }
        });
    }
    
    function addBookToArray(bookData) {
        console.log('Dodawana książka:', bookData);
        
        books.push(bookData);
        
        renderBooks();
        
        showNotification(`Książka "${bookData.title}" została dodana!`);
        
        const addNewBookForm = document.querySelector('#addNewBookForm');
        if(addNewBookForm) {
            addNewBookForm.style.display = 'none';
        }
        document.getElementById('bookForm').reset();
    }
    
    document.addEventListener('click', function(e) {
        if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            menuButton.classList.remove('active');
            dropdownMenu.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            menuButton.classList.remove('active');
            dropdownMenu.classList.remove('active');
        }
    });
    
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Kliknięto:', this.textContent);
            
            if(this.textContent === "Dodaj nową książkę"){
                hideAllSections();
                const mainSection = document.querySelector('.content-main');
                if(mainSection) {
                    mainSection.style.display = 'block';
                    showNotification('Przejdź do formularza dodawania książki!');
                }
            } else if(this.textContent === "Książki"){
                hideAllSections();
                const booksSection = document.querySelector('.content-books');
                if(booksSection) {
                    booksSection.style.display = 'block';
                    renderBooks();
                    showNotification('Sekcja książek została otwarta!');
                } else {
                    showNotification('Sekcja książek nie została znaleziona!');
                }
            } else if(this.textContent === "O nas"){
                hideAllSections();
                const aboutSection = document.querySelector('.content-about');
                if(aboutSection) {
                    aboutSection.style.display = 'block';
                    showNotification('Sekcja "O nas" została otwarta!');
                }
            } else if(this.textContent === "Kontakt"){
                hideAllSections();
                const contactSection = document.querySelector('.content-contact');
                if(contactSection) {
                    contactSection.style.display = 'block';
                    showNotification('Sekcja kontakt została otwarta!');
                }
            }
            
            menuButton.classList.remove('active');
            dropdownMenu.classList.remove('active');
        });
    });
    
    function hideAllSections() {
        const sections = document.querySelectorAll('.content-main, .content-books, .content-about, .content-contact');
        sections.forEach(section => {
            if(section) {
                section.style.display = 'none';
            }
        });
    }
    
    renderBooks();
});