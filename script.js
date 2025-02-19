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

document.getElementById('bookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pagesRead = parseInt(document.getElementById('pagesRead').value);
    const totalPages = parseInt(document.getElementById('totalPages').value);
    
    if (pagesRead > totalPages) {
        alert('Pages read cannot be greater than total pages');
        return;
    }
    
    const progress = Math.round((pagesRead / totalPages) * 100);
    
    const entry = {
        username: document.getElementById('username').value,
        bookTitle: document.getElementById('bookTitle').value,
        author: document.getElementById('author').value,
        pagesRead: pagesRead,
        totalPages: totalPages,
        progress: progress,
        notes: document.getElementById('notes').value,
        date: new Date().toLocaleDateString()
    };
    
    let entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
    const editIndex = document.getElementById('editIndex').value;
    
    if (editIndex !== '') {
        // Edit existing entry
        entries[entries.length - 1 - editIndex] = entry;
        document.getElementById('editIndex').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Book';
    } else {
        // Add new entry
        entries.push(entry);
    }
    
    localStorage.setItem('bookEntries', JSON.stringify(entries));
    
    this.reset();
    document.getElementById('bookModal').style.display = 'none';
    displayEntries();
});

function displayEntries() {
    const entriesDiv = document.getElementById('entries');
    const entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
    
    entriesDiv.innerHTML = '';
    
    entries.reverse().forEach((entry, index) => {
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
                    ${entry.date}
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
    const entry = entries[entries.length - 1 - index]; // Adjust for reverse order

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
        entries.splice(entries.length - 1 - index, 1); // Adjust for reverse order
        localStorage.setItem('bookEntries', JSON.stringify(entries));
        displayEntries();
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

// Display entries when page loads
displayEntries(); 