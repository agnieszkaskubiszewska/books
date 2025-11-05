# Przykład użycia useState - jak działa setReplyText

## Przykład 1: Prosty input tekstowy

```typescript
import React, { useState } from 'react';

const SimpleInput = () => {
  // 1. Deklarujemy stan
  const [text, setText] = useState(''); // wartość początkowa: ''
  
  return (
    <div>
      {/* 2. Wyświetlamy aktualną wartość */}
      <p>Wpisano: {text}</p>
      
      {/* 3. Input kontrolowany - wartość pochodzi ze stanu */}
      <input 
        type="text"
        value={text}  // ← zawsze pokazuje aktualną wartość ze stanu
        onChange={(e) => {
          // 4. Gdy użytkownik pisze, aktualizujemy stan
          setText(e.target.value);  // ← React automatycznie ponownie renderuje komponent
        }}
      />
      
      {/* 5. Przycisk do czyszczenia */}
      <button onClick={() => setText('')}>
        Wyczyść
      </button>
    </div>
  );
};
```

### Co się dzieje:
- `text` = '' (na początku)
- Użytkownik wpisuje "Hello" → `setText('Hello')` → `text` = 'Hello'
- `text` = 'Hello' → komponent się renderuje → input pokazuje "Hello"
- Kliknięcie "Wyczyść" → `setText('')` → `text` = ''

---

## Przykład 2: Licznik (jak w Twoim kodzie z wątkami)

```typescript
import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0); // startujemy od 0
  
  return (
    <div>
      <p>Licznik: {count}</p>
      
      {/* Zwiększanie */}
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
      
      {/* Zmniejszanie */}
      <button onClick={() => setCount(count - 1)}>
        -1
      </button>
      
      {/* Reset */}
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
};
```

---

## Przykład 3: Formularz z wieloma polami (jak w Messages)

```typescript
import React, { useState } from 'react';

const ContactForm = () => {
  // Możesz mieć wiele useState w jednym komponencie!
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = () => {
    console.log('Formularz:', { name, email, message });
    
    // Czyszczenie po wysłaniu (jak w Twoim kodzie!)
    setName('');
    setEmail('');
    setMessage('');
  };
  
  return (
    <form>
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Imię"
      />
      
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      
      <textarea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Wiadomość"
      />
      
      <button type="button" onClick={handleSubmit}>
        Wyślij
      </button>
    </form>
  );
};
```

---

## Przykład 4: Zaawansowane - aktualizacja na podstawie poprzedniej wartości

```typescript
const AdvancedCounter = () => {
  const [count, setCount] = useState(0);
  
  // ❌ ZŁE: nie używaj bezpośrednio wartości w setState
  const badIncrement = () => {
    setCount(count + 1); // działa tylko raz, potem używa starej wartości!
  };
  
  // ✅ DOBRE: użyj funkcji aktualizującej
  const goodIncrement = () => {
    setCount(prevCount => prevCount + 1); // zawsze używa najnowszej wartości!
  };
  
  // ✅ DOBRE dla wielu aktualizacji na raz
  const doubleIncrement = () => {
    setCount(prev => prev + 1); // +1
    setCount(prev => prev + 1); // +2 łącznie (nie +1, bo używa poprzedniej z prev)
  };
  
  return (
    <button onClick={goodIncrement}>
      Kliknięto: {count} razy
    </button>
  );
};
```

---

## Różnica między bezpośrednią wartością a funkcją

```typescript
// ❌ PROBLEM: używanie bezpośredniej wartości
const [count, setCount] = useState(0);

// Przy szybkich kliknięciach może stracić aktualizacje!
const increment = () => {
  setCount(count + 1); // count może być przestarzałe
  setCount(count + 1); // ten też używa starej wartości
  // Rezultat: +1 zamiast +2!
};

// ✅ ROZWIĄZANIE: użyj funkcji
const increment = () => {
  setCount(prev => prev + 1); // prev jest zawsze aktualny
  setCount(prev => prev + 1); // ten też używa najnowszej wartości
  // Rezultat: +2 jak należy!
};
```

---

## Twój przykład z Messages.tsx - jak działa

```typescript
// 1. Inicjalizacja stanu
const [replyText, setReplyText] = useState<string>('');

// 2. Wyświetlenie w textarea
<textarea 
  value={replyText}  // pokazuje aktualną wartość
  onChange={(e) => setReplyText(e.target.value)}  // aktualizuje przy każdej zmianie
/>

// 3. Czyszczenie po wysłaniu
onClick={() => {
  onStartThread(recipientId, replyText);  // używa aktualnej wartości
  setReplyText('');  // czyści stan
  // React automatycznie re-renderuje → textarea staje się pusty
}}

// 4. Czyszczenie przy przełączeniu wątku (useEffect)
useEffect(() => {
  setReplyText('');  // czyści gdy openMessageId się zmienia
}, [openMessageId]);
```

---

## Najważniejsze zasady useState

1. **Zawsze używaj setState do zmiany wartości** ❌ `replyText = 'nowy'` ✅ `setReplyText('nowy')`
2. **React automatycznie ponownie renderuje** - nie musisz tego robić ręcznie
3. **Stan jest asynchroniczny** - zmiany mogą nie być widoczne natychmiast
4. **Używaj funkcji aktualizującej** gdy zależy Ci na poprzedniej wartości: `setCount(prev => prev + 1)`
5. **Możesz mieć wiele useState** w jednym komponencie
6. **Wartość początkowa** jest używana tylko przy pierwszym renderowaniu

---

## Typy w TypeScript

```typescript
// String
const [name, setName] = useState<string>('');

// Number
const [age, setAge] = useState<number>(0);

// Boolean
const [isOpen, setIsOpen] = useState<boolean>(false);

// Array
const [items, setItems] = useState<string[]>([]);

// Object
const [user, setUser] = useState<{name: string, age: number} | null>(null);

// Union types (może być string lub null)
const [message, setMessage] = useState<string | null>(null);
```

---

## Praktyczne ćwiczenie - spróbuj!

Stwórz prosty komponent:
1. Pole tekstowe do wpisania imienia
2. Przycisk "Dodaj"
3. Lista wyświetlająca wszystkie dodane imiona
4. Przycisk "Wyczyść listę"

```typescript
// Podpowiedź:
const [inputValue, setInputValue] = useState('');
const [names, setNames] = useState<string[]>([]);
```

