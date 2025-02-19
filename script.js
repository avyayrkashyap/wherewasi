document.getElementById('bookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const entry = {
        username: document.getElementById('username').value,
        bookTitle: document.getElementById('bookTitle').value,
        author: document.getElementById('author').value,
        progress: document.getElementById('progress').value,
        notes: document.getElementById('notes').value,
        date: new Date().toLocaleDateString()
    };
    
    // Get existing entries or initialize empty array
    let entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
    
    // Add new entry
    entries.push(entry);
    
    // Save to localStorage
    localStorage.setItem('bookEntries', JSON.stringify(entries));
    
    // Reset form
    this.reset();
    
    // Update display
    displayEntries();
});

function displayEntries() {
    const entriesDiv = document.getElementById('entries');
    const entries = JSON.parse(localStorage.getItem('bookEntries')) || [];
    
    entriesDiv.innerHTML = '';
    
    entries.reverse().forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';
        entryElement.innerHTML = `
            <h3>${entry.bookTitle}</h3>
            <p><strong>Reader:</strong> ${entry.username}</p>
            <p><strong>Author:</strong> ${entry.author}</p>
            <p><strong>Progress:</strong> ${entry.progress}%</p>
            <p><strong>Notes:</strong> ${entry.notes}</p>
            <p><strong>Date:</strong> ${entry.date}</p>
        `;
        entriesDiv.appendChild(entryElement);
    });
}

// Display entries when page loads
displayEntries(); 