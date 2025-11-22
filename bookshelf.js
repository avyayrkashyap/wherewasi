// bookshelf.js

document.addEventListener('DOMContentLoaded', () => {
    loadShelves();
    setupModalListeners();
    setupFormListeners();
});

let currentBookId = null; // Track which book is currently open

async function loadShelves() {
    const container = document.getElementById('bookshelfContainer');
    container.innerHTML = '<div class="loading">Loading your library...</div>';

    try {
        const { data: books, error } = await supabaseClient
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group books by user
        const booksByUser = {};
        books.forEach(book => {
            const user = book.username || 'Unknown Reader';
            if (!booksByUser[user]) {
                booksByUser[user] = [];
            }
            booksByUser[user].push(book);
        });

        renderShelves(booksByUser);

    } catch (error) {
        console.error('Error loading books:', error);
        container.innerHTML = '<div class="error">Failed to load books. Please try again.</div>';
    }
}

function renderShelves(booksByUser) {
    const container = document.getElementById('bookshelfContainer');
    container.innerHTML = '';

    let users = Object.keys(booksByUser).sort();

    // Load saved order
    const savedOrder = JSON.parse(localStorage.getItem('bookshelf_order') || '[]');

    // Sort users based on saved order, appending new users at the end
    if (savedOrder.length > 0) {
        users.sort((a, b) => {
            const indexA = savedOrder.indexOf(a);
            const indexB = savedOrder.indexOf(b);

            // If both are in the saved list, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;

            // If only A is in the list, A comes first
            if (indexA !== -1) return -1;

            // If only B is in the list, B comes first
            if (indexB !== -1) return 1;

            // If neither, default to alphabetical
            return a.localeCompare(b);
        });
    }

    if (users.length === 0) {
        container.innerHTML = '<div class="empty-state">The library is empty. Go back to add some books!</div>';
        return;
    }

    users.forEach(user => {
        const userShelfGroup = document.createElement('div');
        userShelfGroup.className = 'user-shelf-group';
        userShelfGroup.draggable = true; // Enable dragging
        userShelfGroup.dataset.user = user; // Store username for identification

        // User Label
        const label = document.createElement('div');
        label.className = 'user-label';
        label.textContent = `${user}'s Collection`;
        userShelfGroup.appendChild(label);

        // Shelf
        const shelf = document.createElement('div');
        shelf.className = 'shelf';

        // Books Row
        const booksRow = document.createElement('div');
        booksRow.className = 'books-row';

        booksByUser[user].forEach(book => {
            const bookSpine = createBookSpine(book);
            booksRow.appendChild(bookSpine);
        });

        userShelfGroup.appendChild(booksRow);
        userShelfGroup.appendChild(shelf);

        // Add Drag Events
        addDragEvents(userShelfGroup);

        container.appendChild(userShelfGroup);
    });
}

function addDragEvents(element) {
    element.addEventListener('dragstart', (e) => {
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Set data to identify the dragged item (though we use the class mostly)
        e.dataTransfer.setData('text/plain', element.dataset.user);
    });

    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        saveShelfOrder();
    });

    element.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        const container = document.getElementById('bookshelfContainer');
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    });

    // Touch Events for Mobile Drag and Drop
    let touchStartY = 0;
    let touchTimer = null;

    element.addEventListener('touchstart', (e) => {
        // Long press to start dragging to avoid conflict with scrolling
        touchTimer = setTimeout(() => {
            element.classList.add('dragging');
            touchStartY = e.touches[0].clientY;
            // Prevent scrolling while dragging
            document.body.style.overflow = 'hidden';

            // Visual feedback that drag has started
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    }, { passive: false });

    element.addEventListener('touchmove', (e) => {
        if (!element.classList.contains('dragging')) {
            clearTimeout(touchTimer);
            return;
        }

        e.preventDefault(); // Prevent scrolling
        const touchY = e.touches[0].clientY;

        const container = document.getElementById('bookshelfContainer');
        const afterElement = getDragAfterElement(container, touchY);

        if (afterElement == null) {
            container.appendChild(element);
        } else {
            container.insertBefore(element, afterElement);
        }
    }, { passive: false });

    element.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
        if (element.classList.contains('dragging')) {
            element.classList.remove('dragging');
            document.body.style.overflow = ''; // Restore scrolling
            saveShelfOrder();
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.user-shelf-group:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveShelfOrder() {
    const container = document.getElementById('bookshelfContainer');
    const shelves = container.querySelectorAll('.user-shelf-group');
    const order = Array.from(shelves).map(shelf => shelf.dataset.user);
    localStorage.setItem('bookshelf_order', JSON.stringify(order));
}

function createBookSpine(book) {
    const spine = document.createElement('div');
    spine.className = 'book-spine';

    // Randomize height slightly for realism (between 160px and 190px)
    const height = 160 + Math.random() * 30;
    spine.style.height = `${height}px`;

    // Generate a color based on the title string to be consistent but varied
    const color = stringToColor(book.book_title);
    spine.style.backgroundColor = color;

    // Title text
    const titleSpan = document.createElement('span');
    titleSpan.textContent = book.book_title;
    spine.appendChild(titleSpan);

    // Click event
    spine.addEventListener('click', () => openBookModal(book));

    return spine;
}

// Helper to generate consistent colors from strings
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use HSL for better looking colors (avoiding too dark/light)
    const h = Math.abs(hash) % 360;
    const s = 60 + (Math.abs(hash) % 20); // 60-80% saturation
    const l = 35 + (Math.abs(hash) % 20); // 35-55% lightness

    return `hsl(${h}, ${s}%, ${l}%)`;
}

function openBookModal(book) {
    currentBookId = book.id;
    const modal = document.getElementById('bookModal');

    // Populate details
    document.getElementById('modalTitle').textContent = book.book_title;
    document.getElementById('modalAuthor').textContent = `by ${book.author}`;
    document.getElementById('modalProgressText').textContent = `${book.pages_read} of ${book.total_pages} pages`;

    const progressPercent = (book.pages_read / book.total_pages) * 100;
    document.getElementById('modalProgressFill').style.width = `${progressPercent}%`;

    // Cover
    const coverDiv = document.getElementById('modalCover');
    if (book.cover_url) {
        coverDiv.style.backgroundImage = `url('${book.cover_url}')`;
        coverDiv.textContent = '';
    } else {
        coverDiv.style.backgroundImage = 'none';
        coverDiv.style.backgroundColor = stringToColor(book.book_title);
        coverDiv.textContent = book.book_title[0];
        coverDiv.style.display = 'flex';
        coverDiv.style.alignItems = 'center';
        coverDiv.style.justifyContent = 'center';
        coverDiv.style.color = 'white';
        coverDiv.style.fontSize = '2rem';
    }

    // Setup Edit Button
    const editBtn = document.getElementById('editBookBtn');
    editBtn.onclick = () => {
        openFormModal(book);
        modal.classList.remove('active');
    };

    // Setup Delete Button
    const deleteBtn = document.getElementById('deleteBookBtn');
    deleteBtn.onclick = async () => {
        if (confirm(`Are you sure you want to delete "${book.book_title}"? This cannot be undone.`)) {
            try {
                const { error } = await supabaseClient
                    .from('books')
                    .delete()
                    .eq('id', book.id);

                if (error) throw error;

                modal.classList.remove('active');
                loadShelves(); // Reload to remove the book
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('Failed to delete book. Please try again.');
            }
        }
    };

    // Notes
    renderNotes(book.notes);

    modal.classList.add('active');
}

function renderNotes(notesData) {
    const notesContainer = document.getElementById('modalNotes');
    notesContainer.innerHTML = '';

    let notes = [];
    if (notesData) {
        try {
            notes = JSON.parse(notesData);
            if (!Array.isArray(notes)) {
                // Handle legacy single note format
                notes = [{ text: notesData, timestamp: new Date().toISOString() }];
            }
        } catch (e) {
            notes = [{ text: notesData, timestamp: new Date().toISOString() }];
        }
    }

    if (notes.length > 0) {
        notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        notes.forEach(note => {
            const noteEntry = document.createElement('div');
            noteEntry.className = 'note-entry';

            const date = new Date(note.timestamp).toLocaleDateString();

            noteEntry.innerHTML = `
                <div class="note-date">${date}</div>
                <button class="note-delete-btn" title="Delete Note">
                    <span class="material-icons" style="font-size: 16px;">close</span>
                </button>
                <p>${note.text}</p>
            `;

            // Add delete listener
            const deleteBtn = noteEntry.querySelector('.note-delete-btn');
            deleteBtn.addEventListener('click', () => deleteNote(note));

            notesContainer.appendChild(noteEntry);
        });
    } else {
        notesContainer.innerHTML = '<p style="opacity: 0.5; font-style: italic;">No notes written in this book yet...</p>';
    }
}

async function deleteNote(noteToDelete) {
    if (!confirm('Delete this note?')) return;

    if (!currentBookId) return;

    try {
        // Fetch current notes to ensure we have the latest state
        const { data: book, error: fetchError } = await supabaseClient
            .from('books')
            .select('notes')
            .eq('id', currentBookId)
            .single();

        if (fetchError) throw fetchError;

        let notes = [];
        if (book.notes) {
            try {
                notes = JSON.parse(book.notes);
                if (!Array.isArray(notes)) notes = [{ text: book.notes, timestamp: new Date().toISOString() }];
            } catch (e) {
                notes = [{ text: book.notes, timestamp: new Date().toISOString() }];
            }
        }

        // Filter out the note
        // We use timestamp comparison as a unique identifier
        const updatedNotes = notes.filter(n => n.timestamp !== noteToDelete.timestamp);

        // Update Supabase
        const { error: updateError } = await supabaseClient
            .from('books')
            .update({ notes: JSON.stringify(updatedNotes) })
            .eq('id', currentBookId);

        if (updateError) throw updateError;

        // Update UI
        renderNotes(JSON.stringify(updatedNotes));

    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
    }
}

function setupModalListeners() {
    const modal = document.getElementById('bookModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');

    const close = () => {
        modal.classList.remove('active');
        currentBookId = null;
    };

    closeBtn.addEventListener('click', close);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            close();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            close();
        }
    });

    // Save Note
    saveNoteBtn.addEventListener('click', async () => {
        const noteInput = document.getElementById('newNoteInput');
        const text = noteInput.value.trim();

        if (!text || !currentBookId) return;

        try {
            // Fetch current notes first
            const { data: book, error: fetchError } = await supabaseClient
                .from('books')
                .select('notes')
                .eq('id', currentBookId)
                .single();

            if (fetchError) throw fetchError;

            let notes = [];
            if (book.notes) {
                try {
                    notes = JSON.parse(book.notes);
                    if (!Array.isArray(notes)) notes = [{ text: book.notes, timestamp: new Date().toISOString() }];
                } catch (e) {
                    notes = [{ text: book.notes, timestamp: new Date().toISOString() }];
                }
            }

            // Add new note
            notes.push({
                text: text,
                timestamp: new Date().toISOString()
            });

            // Update Supabase
            const { error: updateError } = await supabaseClient
                .from('books')
                .update({ notes: JSON.stringify(notes) })
                .eq('id', currentBookId);

            if (updateError) throw updateError;

            // Update UI
            renderNotes(JSON.stringify(notes));
            noteInput.value = '';

        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        }
    });
}

// --- Form & Management Logic ---

function setupFormListeners() {
    const addBookBtn = document.getElementById('addBookBtn');
    const formModal = document.getElementById('formModal');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const bookForm = document.getElementById('bookForm');
    const bookSearch = document.getElementById('bookSearch');

    addBookBtn.addEventListener('click', () => openFormModal());

    closeFormBtn.addEventListener('click', () => {
        formModal.classList.remove('active');
    });

    // Search Logic
    let searchTimeout;
    bookSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();

        if (searchTerm.length < 3) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => searchBooks(searchTerm), 500);
    });

    // Form Submit
    bookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit();
    });

    // Close search results on click outside
    document.addEventListener('click', (e) => {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults.contains(e.target) && e.target !== bookSearch) {
            searchResults.style.display = 'none';
        }
    });
}

function openFormModal(bookToEdit = null) {
    const modal = document.getElementById('formModal');
    const form = document.getElementById('bookForm');
    const title = document.getElementById('formModalTitle');

    form.reset();
    document.getElementById('editBookId').value = '';
    document.getElementById('coverUrl').value = '';

    if (bookToEdit) {
        title.textContent = 'Edit Book';
        document.getElementById('editBookId').value = bookToEdit.id;
        document.getElementById('username').value = bookToEdit.username;
        document.getElementById('bookSearch').value = bookToEdit.book_title;
        document.getElementById('author').value = bookToEdit.author;
        document.getElementById('pagesRead').value = bookToEdit.pages_read;
        document.getElementById('bookTotalPages').value = bookToEdit.total_pages;
        document.getElementById('coverUrl').value = bookToEdit.cover_url || '';
    } else {
        title.textContent = 'Add New Book';
    }

    modal.classList.add('active');
}

async function searchBooks(query) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
        const data = await response.json();

        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        searchResults.style.display = 'block';

        if (data.items && data.items.length > 0) {
            data.items.forEach(book => {
                const volumeInfo = book.volumeInfo;
                const thumbnail = volumeInfo.imageLinks?.thumbnail || '';

                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    ${thumbnail ? `<img src="${thumbnail}" alt="Cover">` : ''}
                    <div class="book-info">
                        <h4>${volumeInfo.title}</h4>
                        <p>${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</p>
                    </div>
                `;

                resultItem.addEventListener('click', () => {
                    document.getElementById('bookSearch').value = volumeInfo.title;
                    document.getElementById('author').value = volumeInfo.authors ? volumeInfo.authors[0] : '';
                    if (volumeInfo.pageCount) {
                        document.getElementById('bookTotalPages').value = volumeInfo.pageCount;
                    }
                    document.getElementById('coverUrl').value = thumbnail;
                    searchResults.style.display = 'none';
                });

                searchResults.appendChild(resultItem);
            });
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No books found</div>';
        }
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

async function handleFormSubmit() {
    const editId = document.getElementById('editBookId').value;
    const pagesRead = parseInt(document.getElementById('pagesRead').value);
    const totalPages = parseInt(document.getElementById('bookTotalPages').value);

    if (pagesRead > totalPages) {
        alert('Pages read cannot be greater than total pages');
        return;
    }

    const progress = Math.round((pagesRead / totalPages) * 100);

    const bookData = {
        username: document.getElementById('username').value,
        book_title: document.getElementById('bookSearch').value,
        author: document.getElementById('author').value,
        pages_read: pagesRead,
        total_pages: totalPages,
        progress: progress,
        cover_url: document.getElementById('coverUrl').value
    };

    try {
        let error;
        if (editId) {
            const { error: updateError } = await supabaseClient
                .from('books')
                .update(bookData)
                .eq('id', editId);
            error = updateError;
        } else {
            const { error: insertError } = await supabaseClient
                .from('books')
                .insert([bookData]);
            error = insertError;
        }

        if (error) throw error;

        document.getElementById('formModal').classList.remove('active');
        loadShelves(); // Reload shelves

        // If we were editing, also update the open book modal if it's still relevant
        if (editId && currentBookId === editId) {
            // We need to re-fetch or just update UI with local data. 
            // Simplest is to close the book modal to avoid sync issues, or re-open it.
            // Let's just reload shelves. The book modal is closed when editing starts.
        }

    } catch (error) {
        console.error('Error saving book:', error);
        alert('Failed to save book. Please try again.');
    }
}
