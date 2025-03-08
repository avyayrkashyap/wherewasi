document.getElementById('addBookBtn').addEventListener('click', () => {
    // Reset form and set to "Add" mode
    document.getElementById('bookForm').reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookModal').style.display = 'block';
});

document.querySelector('.close-modal').addEventListener('click', () => {
    // Reset form when closing modal
    document.getElementById('bookForm').reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookModal').style.display = 'none';
});

// Load books
async function loadBooks() {
    try {
        const { data, error } = await supabaseClient
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        displayEntries(data);
    } catch (error) {
        console.error('Error loading books:', error.message);
    }
}

// Add/Edit book
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
                    notes: bookData.notes,
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
                    notes: bookData.notes,
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

// Delete book
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

// Update form submit handler
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
        notes: document.getElementById('notes').value,
        cover_url: document.getElementById('coverUrl').value
    };
    
    const editId = document.getElementById('editIndex').value;
    await saveBook(bookData, editId || null);
    
    this.reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookModal').style.display = 'none';
});

function displayEntries(entries) {
    const entriesDiv = document.getElementById('entries');
    
    entriesDiv.innerHTML = '';
    
    entries.forEach((entry, index) => {
        const date = new Date(entry.created_at);
        const formattedDate = date.toLocaleDateString('en-GB');
        
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
                    </div>
                </div>
                <div class="pill reader">
                    <span class="material-icons">person_outline</span>
                    ${entry.username}
                </div>
            </div>
            <div class="entry-content">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${entry.progress}%"></div>
                </div>
                <p><strong>Progress:</strong> ${entry.pages_read} of ${entry.total_pages} pages (${entry.progress}%)</p>
                ${entry.notes ? `<p class="notes"><strong>Notes:</strong> ${entry.notes}</p>` : ''}
            </div>
            <div class="entry-footer">
                <div class="pill date">
                    <span class="material-icons">calendar_today</span>
                    ${formattedDate}
                </div>
                <div class="entry-actions">
                    <button class="icon-button edit-btn" data-id="${entry.id}">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-button delete-btn" data-id="${entry.id}">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
        entriesDiv.appendChild(entryElement);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
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

        // Populate form with existing data
        document.getElementById('username').value = data.username;
        document.getElementById('bookSearch').value = data.book_title;
        document.getElementById('author').value = data.author;
        document.getElementById('pagesRead').value = data.pages_read;
        document.getElementById('totalPages').value = data.total_pages;
        document.getElementById('notes').value = data.notes || '';
        document.getElementById('editIndex').value = data.id;
        document.getElementById('coverUrl').value = data.cover_url || '';

        // Update modal title
        document.getElementById('modalTitle').textContent = 'Edit Book';
        
        // Show modal
        document.getElementById('bookModal').style.display = 'block';
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target === modal) {
        // Reset form when closing modal
        document.getElementById('bookForm').reset();
        document.getElementById('editIndex').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Book';
        modal.style.display = 'none';
    }
}

// Load books when page loads
document.addEventListener('DOMContentLoaded', loadBooks);

// Subscribe to real-time changes
supabaseClient
    .channel('public:books')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'books' }, 
        payload => {
            loadBooks();
        }
    )
    .subscribe();

// Add this to your existing JavaScript
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

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('bookSearch');
    
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.style.display = 'none';
    }
}); 