# Book App - Aplikacja do Zarządzania Książkami

## Opis
Nowoczesna aplikacja React do zarządzania kolekcją książek z możliwością dodawania, przeglądania i oceniania książek.

## Technologie
- **React 18** z TypeScript
- **Webpack 5** z Babel
- **CSS3** z nowoczesnymi animacjami
- **Responsywny design** dla wszystkich urządzeń

## Struktura Projektu
```
src/
├── components/          # Komponenty React
│   ├── Header.tsx      # Nagłówek z menu nawigacyjnym
│   ├── AddBookForm.tsx # Formularz dodawania książek
│   ├── BookList.tsx    # Lista książek
│   ├── About.tsx       # Strona "O nas"
│   ├── Contact.tsx     # Strona kontaktowa
│   └── Notification.tsx # Powiadomienia
├── styles/
│   └── index.css       # Style CSS
├── types/
│   └── index.ts        # Definicje typów TypeScript
├── App.tsx             # Główny komponent aplikacji
└── index.tsx           # Punkt wejścia aplikacji
```

## Funkcjonalności
- ✅ Dodawanie nowych książek z obrazkami
- ✅ Przeglądanie listy książek
- ✅ System oceniania (1-5 gwiazdek)
- ✅ Responsywne menu hamburger
- ✅ Nowoczesny design z animacjami
- ✅ Obsługa różnych rozdzielczości ekranów

## Uruchomienie
```bash
npm install          # Instalacja zależności
npm start           # Uruchomienie w trybie deweloperskim
npm run build       # Budowanie produkcyjne
```

## Responsywność
Aplikacja jest w pełni responsywna i dostosowuje się do:
- 📱 Telefonów (max-width: 480px)
- 📱 Tabletów (max-width: 768px)
- 💻 Laptopów (min-width: 1200px)
- 🖥️ Dużych ekranów (min-width: 1920px)

Menu hamburger jest zawsze pozycjonowane przy lewej krawędzi ekranu.
