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

document.getElementById('addBookBtn').addEventListener('click', () => {
    document.getElementById('bookForm').reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Book';
    openModal('bookModal');
});

document.querySelector('.close-modal').addEventListener('click', () => {
    // Reset form when closing modal
    document.getElementById('bookForm').reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Book';
    closeModal('bookModal');
});

let activeUsers = new Set();
let allUsers = new Set();

async function loadBooks() {
    try {
        await updateUsersList(); // Update users list first
        initializeUsernameDropdown(); // Initialize username dropdown
        await filterAndDisplayBooks(); // Then filter and display books
        initializeNoteScrolling(); // Initialize scrolling after books are loaded
    } catch (error) {
        console.error('Error loading books:', error.message);
    }
}

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

async function deleteBook(id) {
    try {
        const { error } = await supabaseClient
            .from('books')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Reload books after delete
        await loadBooks();
    } catch (error) {
        console.error('Error deleting book:', error.message);
    }
}

document.getElementById('bookForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const pagesRead = parseInt(document.getElementById('pagesRead').value);
    const totalPages = parseInt(document.getElementById('totalPages').value);
    
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

function createNoteElement() {
    const noteContainer = document.createElement('div');
    noteContainer.className = 'note-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'note-textarea';
    textarea.placeholder = 'Add your note here...';
    
    const timestamp = new Date().toISOString();
    noteContainer.dataset.timestamp = timestamp;
    
    noteContainer.appendChild(textarea);
    return noteContainer;
}

async function handleNote(e) {
    const id = e.currentTarget.dataset.id;
    try {
        const { data, error } = await supabaseClient
            .from('books')
            .select('notes, book_title, progress')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('noteBookTitle').textContent = data.book_title;
        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = ''; // Clear existing notes

        // Update checkbox state
        const completeCheckbox = document.getElementById('completeBookCheckbox');
        completeCheckbox.dataset.bookId = id;
        completeCheckbox.checked = data.progress === 100;

        // Handle both old and new note formats
        let existingNotes = [];
        if (data.notes) {
            try {
                // Try to parse as JSON array
                existingNotes = JSON.parse(data.notes);
                if (!Array.isArray(existingNotes)) {
                    // If it's JSON but not an array, convert old format to new
                    existingNotes = [{
                        text: data.notes,
                        timestamp: new Date().toISOString()
                    }];
                }
            } catch (parseError) {
                // If parsing fails, it's an old string format
                existingNotes = [{
                    text: data.notes,
                    timestamp: new Date().toISOString()
                }];
            }
        }
        
        // Add existing notes in reverse chronological order
        existingNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(note => {
                const noteElement = createNoteElement();
                noteElement.querySelector('textarea').value = note.text;
                noteElement.dataset.timestamp = note.timestamp;
                notesContainer.appendChild(noteElement);
            });

        // If no notes exist, create one empty note
        if (existingNotes.length === 0) {
            notesContainer.appendChild(createNoteElement());
        }

        document.getElementById('noteBookId').value = id;
        openModal('noteModal');
    } catch (error) {
        console.error('Error loading notes:', error.message);
    }
}

document.getElementById('noteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('noteBookId').value;
    const noteContainers = document.querySelectorAll('.note-container');
    
    const notes = Array.from(noteContainers).map(container => ({
        text: container.querySelector('textarea').value.trim(),
        timestamp: container.dataset.timestamp
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

document.getElementById('addNoteBtn').addEventListener('click', () => {
    const notesContainer = document.getElementById('notesContainer');
    const newNote = createNoteElement();
    notesContainer.insertBefore(newNote, notesContainer.firstChild); // Add at the top
});

function displayEntries(entries) {
    const entriesDiv = document.getElementById('entries');
    entriesDiv.innerHTML = '';
    
    entries.forEach((entry) => {
        // Handle both old and new note formats
        let notesHtml = '';
        if (entry.notes) {
            try {
                // Try to parse as JSON array
                const notesArray = JSON.parse(entry.notes);
                if (Array.isArray(notesArray) && notesArray.length > 0) {
                    notesHtml = `
                        <div class="notes-section" id="notes-${entry.id}">
                            ${notesArray
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                .map(note => `
                                    <div class="notes">
                                        <strong>${new Date(note.timestamp).toLocaleDateString()}</strong>
                                        ${note.text}
                                    </div>
                                `).join('')}
                        </div>
                        <div class="notes-navigation" id="nav-${entry.id}">
                            ${notesArray.map((_, index) => `
                                <div class="note-dot ${index === 0 ? 'active' : ''}"></div>
                            `).join('')}
                        </div>
                    `;
                }
            } catch (parseError) {
                // If parsing fails, it's an old string format
                notesHtml = `
                    <div class="notes-section">
                        <div class="notes">${entry.notes}</div>
                    </div>
                `;
            }
        }

        const entryElement = document.createElement('div');
        entryElement.className = 'entry';
        entryElement.innerHTML = `
            <div class="entry-header">
                <div class="book-info">
                    ${entry.cover_url ? `
                        <div class="book-cover">
                            <img src="${entry.cover_url}" 
                                 alt="Cover of ${entry.book_title}">
                        </div>
                    ` : ''}
                    <div class="title-group">
                        <h3>${entry.book_title}</h3>
                        <p class="author">by ${entry.author}</p>
                        <p class="reader">
                            <span class="material-icons">person_outline</span>
                            ${entry.username}
                        </p>
                    </div>
                </div>
            </div>
            <div class="entry-content">
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${entry.progress}%"></div>
                    </div>
                    <p><strong>Progress:</strong> ${entry.pages_read} of ${entry.total_pages} pages (${entry.progress}%)</p>
                </div>
                <div class="complete-indicator">
                    <span class="material-icons">check_circle</span>
                    <span>Complete</span>
                </div>
                ${notesHtml}
            </div>
            <div class="entry-footer">
                <div class="pill date">
                    <span class="material-icons">calendar_today</span>
                    ${new Date(entry.created_at).toLocaleDateString('en-GB')}
                </div>
                <div class="entry-actions">
                    <button class="kebab-menu-btn" data-id="${entry.id}">
                        <span class="material-icons">more_vert</span>
                    </button>
                    <div class="kebab-menu" data-id="${entry.id}">
                        <button class="menu-item note-btn" data-id="${entry.id}">
                            <span class="material-icons">note_add</span>
                            Add Note
                        </button>
                        <button class="menu-item edit-btn" data-id="${entry.id}">
                            <span class="material-icons">edit</span>
                            Edit
                        </button>
                        <button class="menu-item delete-btn" data-id="${entry.id}">
                            <span class="material-icons">delete</span>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        entriesDiv.appendChild(entryElement);

        // Add this after creating the entry element
        if (entry.progress === 100) {
            entryElement.classList.add('completed');
        }

        // Add kebab menu event listeners
        const kebabBtn = entryElement.querySelector('.kebab-menu-btn');
        const kebabMenu = entryElement.querySelector('.kebab-menu');
        
        kebabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other open menus
            document.querySelectorAll('.kebab-menu').forEach(menu => {
                if (menu !== kebabMenu) {
                    menu.classList.remove('active');
                }
            });
            kebabMenu.classList.toggle('active');
        });

        // Close menu when clicking outside or scrolling
        const closeMenu = (e) => {
            if (!kebabMenu.contains(e.target) && !kebabBtn.contains(e.target)) {
                kebabMenu.classList.remove('active');
            }
        };

        document.addEventListener('click', closeMenu);
        document.addEventListener('scroll', closeMenu);

        // Add your existing event listeners for menu items
        entryElement.querySelector('.note-btn').addEventListener('click', handleNote);
        entryElement.querySelector('.edit-btn').addEventListener('click', handleEdit);
        entryElement.querySelector('.delete-btn').addEventListener('click', handleDelete);
    });
}

function handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    loadBookForEdit(id);
}

async function loadBookForEdit(id) {
    try {
        const { data, error } = await supabaseClient
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Set the edit index
        document.getElementById('editIndex').value = id;

        // Populate form with existing data
        document.getElementById('username').value = data.username;
        document.getElementById('bookSearch').value = data.book_title;
        document.getElementById('author').value = data.author;
        document.getElementById('pagesRead').value = data.pages_read;
        document.getElementById('totalPages').value = data.total_pages;
        document.getElementById('coverUrl').value = data.cover_url || '';

        // Update modal title
        document.getElementById('modalTitle').textContent = 'Edit Book';
        
        // Show modal
        openModal('bookModal');
    } catch (error) {
        console.error('Error loading book for edit:', error.message);
    }
}

function handleDelete(e) {
    if (confirm('Are you sure you want to delete this book?')) {
        const id = e.currentTarget.dataset.id;
        deleteBook(id);
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target === modal) {
        // Reset form when closing modal
        document.getElementById('bookForm').reset();
        document.getElementById('editIndex').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Book';
        closeModal('bookModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUserFilter();
    loadBooks();
    initializeNoteScrolling();
});

supabaseClient
    .channel('public:books')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'books' }, 
        payload => {
            updateUsersList();
            filterAndDisplayBooks();
        }
    )
    .subscribe();

let searchTimeout;

document.getElementById('bookSearch').addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length < 3) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        searchBooks(searchTerm);
    }, 500);
});

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
                const thumbnail = volumeInfo.imageLinks?.thumbnail || 'placeholder-image-url';
                
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="${thumbnail}" alt="Book cover" onerror="this.src='placeholder-image-url'">
                    <div class="book-info">
                        <h4>${volumeInfo.title}</h4>
                        <p>${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</p>
                        ${volumeInfo.pageCount ? `<p>${volumeInfo.pageCount} pages</p>` : ''}
                    </div>
                `;
                
                resultItem.addEventListener('click', () => {
                    fillBookDetails(volumeInfo);
                    searchResults.style.display = 'none';
                });
                
                searchResults.appendChild(resultItem);
            });
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No books found</div>';
        }
    } catch (error) {
        console.error('Error searching books:', error);
        document.getElementById('searchResults').innerHTML = 
            '<div class="search-result-item">Error searching books</div>';
    }
}

function fillBookDetails(volumeInfo) {
    document.getElementById('bookSearch').value = volumeInfo.title;
    document.getElementById('author').value = volumeInfo.authors ? volumeInfo.authors[0] : '';
    if (volumeInfo.pageCount) {
        document.getElementById('totalPages').value = volumeInfo.pageCount;
    }
    // Store the cover URL in a hidden input
    document.getElementById('coverUrl').value = volumeInfo.imageLinks?.thumbnail || '';
}

document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('bookSearch');
    
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.style.display = 'none';
    }
});

function initializeUserFilter() {
    const chip = document.getElementById('userFilterChip');
    const dropdown = document.getElementById('userFilterDropdown');
    const searchInput = document.getElementById('userSearchInput');

    // Toggle dropdown
    chip.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !chip.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Handle user search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const options = document.querySelectorAll('.filter-option');
        
        options.forEach(option => {
            const username = option.querySelector('label').textContent.toLowerCase();
            option.style.display = username.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

async function updateUsersList() {
    try {
        const { data, error } = await supabaseClient
            .from('books')
            .select('username')
            .order('username');

        if (error) throw error;

        // Get unique usernames
        const users = [...new Set(data.map(book => book.username))];
        allUsers = new Set(users);
        
        // If activeUsers is empty, include all users by default
        if (activeUsers.size === 0) {
            activeUsers = new Set(users);
        }

        // Update dropdown options
        const optionsContainer = document.getElementById('userFilterOptions');
        optionsContainer.innerHTML = '';

        users.forEach(username => {
            const option = document.createElement('div');
            option.className = 'filter-option';
            option.innerHTML = `
                <input type="checkbox" id="user-${username}" 
                       ${activeUsers.has(username) ? 'checked' : ''}>
                <label for="user-${username}">${username}</label>
            `;

            option.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) {
                    activeUsers.add(username);
                } else {
                    activeUsers.delete(username);
                }
                filterAndDisplayBooks();
            });

            optionsContainer.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating users list:', error.message);
    }
}

async function filterAndDisplayBooks() {
    try {
        const { data, error } = await supabaseClient
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter books by active users
        const filteredBooks = data.filter(book => activeUsers.has(book.username));
        displayEntries(filteredBooks);
    } catch (error) {
        console.error('Error filtering books:', error.message);
    }
}

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        const modalId = button.closest('.modal').id;
        closeModal(modalId);
    });
});

function initializeNoteScrolling() {
    document.querySelectorAll('.notes-section').forEach(section => {
        const id = section.id.split('-')[1];
        const nav = document.getElementById(`nav-${id}`);
        const dots = nav.querySelectorAll('.note-dot');
        
        // Update dots on scroll
        section.addEventListener('scroll', () => {
            const index = Math.round(section.scrollLeft / section.offsetWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });

        // Add touch handling for smooth swipe
        let startX;
        let scrollLeft;

        section.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - section.offsetLeft;
            scrollLeft = section.scrollLeft;
        });

        section.addEventListener('touchmove', (e) => {
            if (!startX) return;
            e.preventDefault();
            const x = e.touches[0].pageX - section.offsetLeft;
            const walk = (x - startX) * 2;
            section.scrollLeft = scrollLeft - walk;
        });

        section.addEventListener('touchend', () => {
            startX = null;
            // Update dots after touch scroll ends
            setTimeout(() => {
                const index = Math.round(section.scrollLeft / section.offsetWidth);
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }, 150); // Small delay to let scroll finish
        });

        // Click handling for dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                section.scrollTo({
                    left: index * section.offsetWidth,
                    behavior: 'smooth'
                });
                // Update active dot
                dots.forEach((d, i) => {
                    d.classList.toggle('active', i === index);
                });
            });
        });
    });
}

// Add this function to handle username dropdown
function initializeUsernameDropdown() {
    const usernameInput = document.getElementById('username');
    const usernameDropdown = document.getElementById('usernameDropdown');
    
    // Show dropdown when input is focused
    usernameInput.addEventListener('focus', () => {
        updateUsernameDropdown();
        usernameDropdown.classList.add('active');
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!usernameInput.contains(e.target) && !usernameDropdown.contains(e.target)) {
            usernameDropdown.classList.remove('active');
        }
    });
    
    // Handle input changes
    usernameInput.addEventListener('input', () => {
        updateUsernameDropdown();
    });
}

function updateUsernameDropdown() {
    const usernameInput = document.getElementById('username');
    const usernameDropdown = document.getElementById('usernameDropdown');
    const searchTerm = usernameInput.value.toLowerCase();
    
    // Clear existing dropdown items
    usernameDropdown.innerHTML = '';
    
    // Filter and display matching users
    Array.from(allUsers)
        .filter(username => username.toLowerCase().includes(searchTerm))
        .forEach(username => {
            const item = document.createElement('div');
            item.className = 'username-dropdown-item';
            item.textContent = username;
            item.addEventListener('click', () => {
                usernameInput.value = username;
                usernameDropdown.classList.remove('active');
            });
            usernameDropdown.appendChild(item);
        });
}

// Update the markBookAsComplete function
async function markBookAsComplete(bookId, isComplete) {
    try {
        const { error } = await supabaseClient
            .from('books')
            .update({ progress: isComplete ? 100 : 0 })
            .eq('id', bookId);

        if (error) throw error;
        
        // Reload books to update the progress bar
        await loadBooks();
    } catch (error) {
        console.error('Error marking book as complete:', error.message);
    }
}

// Add event listener for the checkbox
document.getElementById('completeBookCheckbox').addEventListener('change', function() {
    const bookId = this.dataset.bookId;
    if (bookId) {
        markBookAsComplete(bookId, this.checked);
    }
});