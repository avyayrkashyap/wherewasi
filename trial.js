// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    setupEventListeners();
    setupRealTimeSubscription();
});

// Function to load books from Supabase
async function loadBooks() {
    try {
        const { data: books, error } = await supabaseClient
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update stats
        updateStats(books);

        // Display books
        displayBooks(books);

        // Update username dropdown
        updateUsernameDropdown(books);
    } catch (error) {
        console.error('Error loading books:', error.message);
    }
}

// Function to update statistics
function updateStats(books) {
    const totalBooks = books.length;
    const completedBooks = books.filter(book => book.progress === 100).length;
    const totalPages = books.reduce((sum, book) => sum + book.pages_read, 0);

    document.getElementById('totalBooks').textContent = totalBooks;
    document.getElementById('completedBooks').textContent = completedBooks;
    document.getElementById('totalPages').textContent = totalPages;
}

// Function to display books in the grid
function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';

    // Group books by reader
    const booksByReader = books.reduce((acc, book) => {
        if (!acc[book.username]) {
            acc[book.username] = [];
        }
        acc[book.username].push(book);
        return acc;
    }, {});

    // Sort readers by most recent book
    const sortedReaders = Object.entries(booksByReader)
        .sort(([, booksA], [, booksB]) => {
            const latestA = Math.max(...booksA.map(b => new Date(b.created_at)));
            const latestB = Math.max(...booksB.map(b => new Date(b.created_at)));
            return latestB - latestA;
        });

    // Get minimized state from localStorage
    const minimizedReaders = JSON.parse(localStorage.getItem('minimizedReaders') || '{}');

    // Create sections for each reader
    sortedReaders.forEach(([reader, readerBooks]) => {
        // Sort books by creation date (newest first)
        readerBooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const readerSection = document.createElement('div');
        readerSection.className = 'reader-section';
        readerSection.dataset.reader = reader;
        
        const isMinimized = minimizedReaders[reader];
        
        readerSection.innerHTML = `
            <div class="reader-header">
                <button class="toggle-section glass-button-icon">
                    <span class="material-icons">${isMinimized ? 'expand_more' : 'expand_less'}</span>
                </button>
                <span class="material-icons">person_outline</span>
                <h2>${reader}</h2>
            </div>
            <div class="books-scroll-container" style="display: ${isMinimized ? 'none' : 'block'}">
                <div class="books-row">
                    ${readerBooks.map(book => `
                        <div class="book-card">
                            <div class="book-cover">
                                ${book.cover_url ? 
                                    `<img src="${book.cover_url}" alt="${book.book_title}">` :
                                    `<div class="no-cover">${book.book_title.charAt(0)}</div>`
                                }
                            </div>
                            <div class="book-info">
                                <h3>${book.book_title}</h3>
                                <p class="author">by ${book.author}</p>
                                <div class="progress-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${book.progress}%"></div>
                                    </div>
                                    <p>${book.pages_read} of ${book.total_pages} pages</p>
                                </div>
                                <div class="book-meta">
                                    <span class="date">
                                        <span class="material-icons">calendar_today</span>
                                        ${new Date(book.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div class="book-actions">
                                <button class="action-btn note-btn" data-id="${book.id}">
                                    <span class="material-icons">note_add</span>
                                </button>
                                <button class="action-btn edit-btn" data-id="${book.id}">
                                    <span class="material-icons">edit</span>
                                </button>
                                <button class="action-btn delete-btn" data-id="${book.id}">
                                    <span class="material-icons">delete</span>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners for the action buttons
        readerSection.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', () => handleNote(btn.dataset.id));
        });
        readerSection.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => handleEdit(btn.dataset.id));
        });
        readerSection.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDelete(btn.dataset.id));
        });

        // Add toggle functionality
        const toggleBtn = readerSection.querySelector('.toggle-section');
        const booksContainer = readerSection.querySelector('.books-scroll-container');
        const toggleIcon = toggleBtn.querySelector('.material-icons');

        toggleBtn.addEventListener('click', () => {
            const isMinimized = booksContainer.style.display === 'none';
            booksContainer.style.display = isMinimized ? 'block' : 'none';
            toggleIcon.textContent = isMinimized ? 'expand_less' : 'expand_more';
            
            // Save state to localStorage
            const minimizedReaders = JSON.parse(localStorage.getItem('minimizedReaders') || '{}');
            minimizedReaders[reader] = !isMinimized;
            localStorage.setItem('minimizedReaders', JSON.stringify(minimizedReaders));
        });

        booksGrid.appendChild(readerSection);
    });
}

// Event handlers for book actions
async function handleNote(bookId) {
    try {
        const { data: book, error } = await supabaseClient
            .from('books')
            .select('notes, book_title')
            .eq('id', bookId)
            .single();

        if (error) throw error;

        document.getElementById('noteBookId').value = bookId;
        document.getElementById('noteBookTitle').textContent = book.book_title;
        
        // Load existing notes
        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = '';
        
        if (book.notes) {
            try {
                const notes = JSON.parse(book.notes);
                if (Array.isArray(notes)) {
                    notes.forEach(note => {
                        addNoteToContainer(notesContainer, note);
                    });
                }
            } catch (e) {
                // If notes is not JSON, treat it as a single note
                addNoteToContainer(notesContainer, { text: book.notes });
            }
        }

        openModal('noteModal');
    } catch (error) {
        console.error('Error loading notes:', error.message);
    }
}

// Helper function to create a new note element
function createNoteElement(note = { text: '', timestamp: new Date().toISOString() }) {
    const noteContainer = document.createElement('div');
    noteContainer.className = 'note-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'note-textarea';
    textarea.value = note.text || '';
    textarea.placeholder = 'Add your note here...';
    
    // Set initial height
    setTimeout(() => {
        textarea.style.height = '0px';
        textarea.style.height = textarea.scrollHeight + 'px';
    }, 0);
    
    // Auto-resize on input
    textarea.addEventListener('input', function() {
        this.style.height = '0px';
        this.style.height = this.scrollHeight + 'px';
    });
    
    const timestamp = document.createElement('div');
    timestamp.className = 'note-timestamp';
    timestamp.textContent = new Date(note.timestamp).toLocaleString();
    
    noteContainer.appendChild(textarea);
    noteContainer.appendChild(timestamp);
    
    return noteContainer;
}

function addNoteToContainer(container, note) {
    const noteElement = createNoteElement(note);
    container.appendChild(noteElement);
    
    // Trigger initial resize after a small delay to ensure proper calculation
    setTimeout(() => {
        const textarea = noteElement.querySelector('.note-textarea');
        textarea.style.height = '0px';
        textarea.style.height = textarea.scrollHeight + 'px';
    }, 0);
}

async function handleEdit(bookId) {
    try {
        const { data: book, error } = await supabaseClient
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error) throw error;

        // Populate form with book data
        document.getElementById('editIndex').value = bookId;
        document.getElementById('username').value = book.username;
        document.getElementById('bookSearch').value = book.book_title;
        document.getElementById('author').value = book.author;
        document.getElementById('pagesRead').value = book.pages_read;
        document.getElementById('bookTotalPages').value = book.total_pages;
        document.getElementById('coverUrl').value = book.cover_url || '';
        document.getElementById('modalTitle').textContent = 'Edit Book';

        openModal('bookModal');
    } catch (error) {
        console.error('Error loading book for edit:', error.message);
    }
}

async function handleDelete(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        try {
            const { error } = await supabaseClient
                .from('books')
                .delete()
                .eq('id', bookId);

            if (error) throw error;

            // Reload books after deletion
            loadBooks();
        } catch (error) {
            console.error('Error deleting book:', error.message);
        }
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop');
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    backdrop.style.display = 'block';
    modal.style.display = 'block';
    
    // Trigger reflow to enable transition
    modal.offsetHeight;
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop');
    document.body.style.overflow = '';
    modal.classList.remove('active');
    backdrop.style.display = 'none';
    
    // Wait for transition to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Setup event listeners
function setupEventListeners() {
    // Add book button
    document.getElementById('addBookBtn').addEventListener('click', () => {
        document.getElementById('bookForm').reset();
        document.getElementById('editIndex').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Book';
        openModal('bookModal');
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.closest('.glass-modal').id;
            closeModal(modalId);
        });
    });

    // Book form submission
    document.getElementById('bookForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
        
        const editId = document.getElementById('editIndex').value;
        await saveBook(bookData, editId ? editId : null);
        
        this.reset();
        document.getElementById('editIndex').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Book';
        closeModal('bookModal');
    });

    // Note form submission
    document.getElementById('noteForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('noteBookId').value;
        const noteContainers = document.querySelectorAll('.note-container');
        
        const notes = Array.from(noteContainers).map(container => ({
            text: container.querySelector('textarea').value.trim(),
            timestamp: container.dataset.timestamp || new Date().toISOString()
        })).filter(note => note.text !== ''); // Remove empty notes
        
        try {
            const { error } = await supabaseClient
                .from('books')
                .update({ notes: JSON.stringify(notes) })
                .eq('id', id);

            if (error) throw error;

            closeModal('noteModal');
            await loadBooks();
        } catch (error) {
            console.error('Error saving notes:', error.message);
        }
    });

    // Add note button
    document.getElementById('addNoteBtn').addEventListener('click', () => {
        const notesContainer = document.getElementById('notesContainer');
        const newNote = createNoteElement();
        notesContainer.insertBefore(newNote, notesContainer.firstChild);
    });

    // Username input and dropdown
    const usernameInput = document.getElementById('username');
    const usernameDropdown = document.getElementById('usernameDropdown');

    usernameInput.addEventListener('focus', () => {
        usernameDropdown.style.display = 'block';
    });

    usernameInput.addEventListener('input', () => {
        const value = usernameInput.value.toLowerCase();
        const items = usernameDropdown.querySelectorAll('.dropdown-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(value) ? 'block' : 'none';
        });
    });

    usernameDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            usernameInput.value = e.target.textContent;
            usernameDropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!usernameInput.contains(e.target) && !usernameDropdown.contains(e.target)) {
            usernameDropdown.style.display = 'none';
        }
    });

    // Book search functionality
    const bookSearchInput = document.getElementById('bookSearch');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    bookSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = bookSearchInput.value.trim();
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            const books = await searchGoogleBooks(query);
            displaySearchResults(books);
        }, 300);
    });

    bookSearchInput.addEventListener('focus', () => {
        const query = bookSearchInput.value.trim();
        if (query.length >= 2) {
            searchGoogleBooks(query).then(displaySearchResults);
        }
    });

    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.book-search-item');
        if (item) {
            const title = item.dataset.title;
            const author = item.dataset.author;
            const pages = item.dataset.pages;
            const cover = item.dataset.cover;

            document.getElementById('bookSearch').value = title;
            document.getElementById('author').value = author;
            document.getElementById('bookTotalPages').value = pages;
            document.getElementById('coverUrl').value = cover;
            
            searchResults.style.display = 'none';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!bookSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Setup real-time subscription
function setupRealTimeSubscription() {
    supabaseClient
        .channel('public:books')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'books' }, 
            payload => {
                loadBooks();
            }
        )
        .subscribe();
}

// Function to save a book
async function saveBook(bookData, editId = null) {
    try {
        if (editId) {
            // Update existing book
            const { error } = await supabaseClient
                .from('books')
                .update({
                    username: bookData.username,
                    book_title: bookData.book_title,
                    author: bookData.author,
                    pages_read: bookData.pages_read,
                    total_pages: bookData.total_pages,
                    progress: bookData.progress,
                    cover_url: bookData.cover_url
                })
                .eq('id', editId);

            if (error) throw error;
        } else {
            // Insert new book
            const { error } = await supabaseClient
                .from('books')
                .insert([{
                    username: bookData.username,
                    book_title: bookData.book_title,
                    author: bookData.author,
                    pages_read: bookData.pages_read,
                    total_pages: bookData.total_pages,
                    progress: bookData.progress,
                    cover_url: bookData.cover_url
                }]);

            if (error) throw error;
        }

        // Reload books after save
        await loadBooks();
    } catch (error) {
        console.error('Error saving book:', error.message);
    }
}

// Function to update username dropdown
function updateUsernameDropdown(books) {
    const usernames = [...new Set(books.map(book => book.username))].sort();
    const dropdown = document.getElementById('usernameDropdown');
    dropdown.innerHTML = usernames.map(username => 
        `<div class="dropdown-item">${username}</div>`
    ).join('');
}

// Google Books API integration
async function searchGoogleBooks(query) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error searching Google Books:', error);
        return [];
    }
}

function displaySearchResults(books) {
    const searchResults = document.getElementById('searchResults');
    if (!books.length) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.innerHTML = books.map(book => {
        const volumeInfo = book.volumeInfo;
        const coverUrl = volumeInfo.imageLinks?.thumbnail || '';
        return `
            <div class="book-search-item" data-title="${volumeInfo.title}" 
                 data-author="${volumeInfo.authors?.[0] || ''}" 
                 data-pages="${volumeInfo.pageCount || ''}"
                 data-cover="${coverUrl}">
                <div class="book-search-content">
                    <img src="${coverUrl}" alt="${volumeInfo.title}" class="book-search-cover">
                    <div class="book-search-info">
                        <div class="book-search-title">${volumeInfo.title}</div>
                        <div class="book-search-author">${volumeInfo.authors?.[0] || 'Unknown Author'}</div>
                        ${volumeInfo.pageCount ? `<div class="book-search-pages">${volumeInfo.pageCount} pages</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    searchResults.style.display = 'block';
} 