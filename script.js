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
        const { data, error } = await supabase
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
            const { error } = await supabase
                .from('books')
                .update({
                    username: bookData.username,
                    book_title: bookData.bookTitle,
                    author: bookData.author,
                    pages_read: bookData.pagesRead,
                    total_pages: bookData.totalPages,
                    progress: bookData.progress,
                    notes: bookData.notes
                })
                .eq('id', editId);

            if (error) throw error;
        } else {
            // Insert new book
            const { error } = await supabase
                .from('books')
                .insert([{
                    username: bookData.username,
                    book_title: bookData.bookTitle,
                    author: bookData.author,
                    pages_read: bookData.pagesRead,
                    total_pages: bookData.totalPages,
                    progress: bookData.progress,
                    notes: bookData.notes
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
        const { error } = await supabase
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
        bookTitle: document.getElementById('bookTitle').value,
        author: document.getElementById('author').value,
        pagesRead: pagesRead,
        totalPages: totalPages,
        progress: progress,
        notes: document.getElementById('notes').value
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
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';
        entryElement.innerHTML = `
            <div class="entry-header">
                <div class="title-group">
                    <h3>${entry.bookTitle}</h3>
                    <p class="author">by ${entry.author}</p>
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
                <p><strong>Progress:</strong> ${entry.pagesRead} of ${entry.totalPages} pages (${entry.progress}%)</p>
                ${entry.notes ? `<p class="notes"><strong>Notes:</strong> ${entry.notes}</p>` : ''}
            </div>
            <div class="entry-footer">
                <div class="pill date">
                    <span class="material-icons">calendar_today</span>
                    ${entry.created_at}
                </div>
                <div class="entry-actions">
                    <button class="icon-button edit-btn" data-index="${index}">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-button delete-btn" data-index="${index}">
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
    const index = e.currentTarget.dataset.index;
    const entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
    const entry = entries[index];

    // Populate form with existing data
    document.getElementById('username').value = entry.username;
    document.getElementById('bookTitle').value = entry.bookTitle;
    document.getElementById('author').value = entry.author;
    document.getElementById('pagesRead').value = entry.pagesRead;
    document.getElementById('totalPages').value = entry.totalPages;
    document.getElementById('notes').value = entry.notes;
    document.getElementById('editIndex').value = index;

    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Book';
    
    // Show modal
    document.getElementById('bookModal').style.display = 'block';
}

function handleDelete(e) {
    if (confirm('Are you sure you want to delete this book?')) {
        const index = e.currentTarget.dataset.index;
        const entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
        const id = entries[index].id;
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
supabase
    .channel('public:books')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'books' }, 
        payload => {
            loadBooks();
        }
    )
    .subscribe(); 