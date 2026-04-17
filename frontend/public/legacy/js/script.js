/*
   VEMU Library Management System - CORE LOGIC ENGINE
   Updated for stable localStorage autosave, share/import backup,
   real book management, and transaction handling.
*/

const STORAGE_KEYS = {
    users: 'vemu_users',
    currentUser: 'vemu_current_user',
    books: 'vemu_books',
    studentData: 'vemu_student_data',
    transactions: 'vemu_transactions',
    notifications: 'vemu_notifications',
    receipts: 'vemu_payment_receipts',
    renewalRequests: 'vemu_renewal_requests',
    theme: 'vemu_theme',
    smsApiBase: 'vemu_sms_api_base',
    feedbackEntries: 'vemu_feedback_entries',
    feedbackPrompt: 'vemu_feedback_prompt',
    bookSuggestions: 'vemu_book_suggestions',
    assistantVoice: 'vemu_assistant_voice_enabled',
    serverSyncAt: 'vemu_server_sync_at'
};

function autoSyncSafe() {
    const base = localStorage.getItem('vemu_sms_api_base');
    if (!base) return;

    if (document.readyState === 'loading') return;

    clearTimeout(window.__syncTimer);

    window.__syncTimer = setTimeout(async () => {
        try {
            const state = getPortableLibraryState();

            await fetch(base + '/api/library-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state })
            });

            console.log("✅ Synced to MongoDB");
        } catch (e) {
            console.warn("⚠ Sync failed");
        }
    }, 500);
}

let serverStateSyncTimer = null;

function scheduleServerStateSync(delay = 700) {
    if (!getServerApiBase()) return;
    if (document.readyState === 'loading') return;
    if (serverStateSyncTimer) window.clearTimeout(serverStateSyncTimer);
    serverStateSyncTimer = window.setTimeout(() => {
        syncPortableLibraryState().catch(() => {});
    }, delay);
}

async function syncPortableLibraryState() {
    const state = getPortableLibraryState();
    const result = await callServerJson('/api/library-state', { state });
    if (result.ok) localStorage.setItem(STORAGE_KEYS.serverSyncAt, new Date().toISOString());
    return result;
}

const initialBooks = [
    { id: 'V-1001', title: 'Signals and Systems', author: 'Alan V. Oppenheim', category: 'ECE', isbn: '978-0138147', qty: 12, available: 10, publisher: 'Pearson' },
    { id: 'V-1002', title: 'Data Structures with C++', author: 'E. Balagurusamy', category: 'CSE', isbn: '978-0070144', qty: 45, available: 42, publisher: 'McGraw Hill' },
    { id: 'V-1003', title: 'Kinematics of Machinery', author: 'S.S. Rattan', category: 'Mech', isbn: '978-8121908018', qty: 15, available: 15, publisher: 'Tata McGraw Hill' },
    { id: 'V-1004', title: 'Electrical Technology', author: 'B.L. Theraja', category: 'EEE', isbn: '978-8121924407', qty: 28, available: 25, publisher: 'S Chand' },
    { id: 'V-1005', title: 'Python for Data Science', author: 'Jake VanderPlas', category: 'CSE', isbn: '978-1491912058', qty: 20, available: 18, publisher: "O'Reilly" },
    { id: 'V-1006', title: 'Software Engineering', author: 'Ian Sommerville', category: 'CSE', isbn: '978-9332582699', qty: 16, available: 9, publisher: 'Pearson' },
    { id: 'V-1007', title: 'Machine Learning Design', author: 'Christopher M. Bishop', category: 'CSE', isbn: '978-0387310732', qty: 8, available: 3, publisher: 'Springer' }
];

const fixedAdminAccount = {
    uid: 'admin-master',
    id: 'vinayaka2850',
    username: 'vinayaka2850',
    pin: 'omkar2850',
    role: 'admin',
    name: 'Omkar Vinayaka P',
    status: 'ACTIVE',
    accountId: 'ADM-VEMU-001',
    dept: 'Administration',
    year: 'Administrator'
};

const seedLibrarianAccount = {
    uid: 'librarian-seed-001',
    id: 'librarian01',
    username: 'librarian01',
    pin: 'lib123',
    role: 'librarian',
    name: 'Chief Librarian',
    status: 'ACTIVE',
    accountId: 'LIB-VEMU-001',
    dept: 'Central Library',
    year: 'Institutional Staff',
    createdByRole: 'admin',
    createdByName: 'Omkar Vinayaka P'
};

const initialStudentData = {
    profile: {
        dept: 'B.Tech CSE',
        year: 'III Year',
        roll: '23-CSE-001'
    },
    fines: 25,
    issuedBooks: [
        {
            title: 'Machine Learning Design',
            author: 'Christopher M. Bishop',
            issueDate: '02 Mar 2026',
            dueDate: '16 Mar 2026',
            status: 'Overdue'
        },
        {
            title: 'Software Engineering',
            author: 'Ian Sommerville',
            issueDate: '05 Mar 2026',
            dueDate: '19 Mar 2026',
            status: 'Due Soon'
        }
    ],
    notifications: [
        'Your book "Software Engineering" is due in 2 days.',
        'Pending fine payment of ₹25.00 is available in your account.',
        'New arrivals added in CSE reference section.'
    ],
    historyCount: 18,
    savedBooks: 4
};

const initialTransactions = [
    {
        txId: 'TX-1001',
        bookId: 'V-1004',
        bookTitle: 'Electrical Technology',
        borrowerId: 'SCH-CSE-102',
        borrowerRole: 'student',
        issueDate: '2026-03-01',
        dueDate: '2026-03-16',
        returnedAt: '',
        fine: 0,
        status: 'ISSUED'
    }
];

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}


function getBookSuggestions() {
    const saved = localStorage.getItem(STORAGE_KEYS.bookSuggestions);
    if (!saved) return [];
    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveBookSuggestions(items = []) {
    localStorage.setItem(STORAGE_KEYS.bookSuggestions, JSON.stringify(Array.isArray(items) ? items : []));
    scheduleServerStateSync();
}


function normalizeBookSuggestion(payload = {}, user = null) {
    const copies = Math.max(1, Number(payload.requestedCopies || payload.copies || 1));
    const role = String(payload.suggesterRole || user?.role || '').toLowerCase() || 'faculty';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    return {
        suggestionId: payload.suggestionId || createId('SGT'),
        suggesterUid: payload.suggesterUid || payload.facultyUid || user?.uid || '',
        suggesterName: payload.suggesterName || payload.facultyName || user?.name || user?.username || roleLabel,
        suggesterUsername: payload.suggesterUsername || payload.facultyUsername || user?.username || '',
        suggesterAccountId: payload.suggesterAccountId || payload.facultyAccountId || user?.accountId || '',
        suggesterRole: role,
        department: payload.department || user?.dept || user?.profileDetails?.department || '',
        designation: payload.designation || user?.year || user?.profileDetails?.designation || roleLabel,
        bookName: String(payload.bookName || payload.title || '').trim(),
        authorName: String(payload.authorName || payload.author || '').trim(),
        edition: String(payload.edition || payload.audition || '').trim(),
        publisher: String(payload.publisher || '').trim(),
        category: String(payload.category || '').trim(),
        isbn: String(payload.isbn || '').trim(),
        requestedCopies: copies,
        reason: String(payload.reason || '').trim(),
        additionalNotes: String(payload.additionalNotes || '').trim(),
        status: String(payload.status || 'PENDING').toUpperCase(),
        suggestedAt: payload.suggestedAt || new Date().toISOString(),
        reviewedAt: payload.reviewedAt || '',
        reviewedBy: payload.reviewedBy || '',
        reviewedByRole: payload.reviewedByRole || '',
        reviewRemark: payload.reviewRemark || '',
        catalogBookId: payload.catalogBookId || '',
        catalogAction: payload.catalogAction || ''
    };
}

function normalizeLegacySuggestions() {
    const suggestions = getBookSuggestions();
    const normalized = suggestions.map(item => normalizeBookSuggestion(item, null));
    if (JSON.stringify(normalized) !== JSON.stringify(suggestions)) saveBookSuggestions(normalized);
    return normalized;
}

function validateSuggestionPayload(payload = {}) {
    if (!String(payload.bookName || '').trim()) return { ok: false, message: 'Book name is required' };
    if (!String(payload.authorName || '').trim()) return { ok: false, message: 'Author name is required' };
    if (!String(payload.edition || '').trim()) return { ok: false, message: 'Edition is required' };
    return { ok: true };
}

function submitBookSuggestion(payload = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['faculty', 'student'].includes(currentUser.role)) return { ok: false, message: 'Only student or faculty can submit suggestions' };
    const latestUser = getUserByUid(currentUser.uid) || currentUser;
    const valid = validateSuggestionPayload(payload);
    if (!valid.ok) return valid;
    const suggestions = normalizeLegacySuggestions();
    const nextSuggestion = normalizeBookSuggestion(payload, latestUser);
    suggestions.unshift(nextSuggestion);
    saveBookSuggestions(suggestions.slice(0, 400));
    addNotification(`New ${nextSuggestion.suggesterRole} suggestion received for ${nextSuggestion.bookName}`, 'library');
    return { ok: true, suggestion: nextSuggestion, message: 'Book suggestion sent successfully.' };
}

function submitFacultySuggestion(payload = {}) {
    return submitBookSuggestion(payload);
}

function submitStudentSuggestion(payload = {}) {
    return submitBookSuggestion(payload);
}

function getUserSuggestions(userUid = '', role = '') {
    const uid = String(userUid || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizeLegacySuggestions().filter(item => (!uid || item.suggesterUid === uid) && (!normalizedRole || item.suggesterRole === normalizedRole));
}

function getFacultySuggestions(userUid = '') {
    return getUserSuggestions(userUid, 'faculty');
}

function getStudentSuggestions(userUid = '') {
    return getUserSuggestions(userUid, 'student');
}

function findMatchingCatalogBook(suggestion = {}) {
    const title = String(suggestion.bookName || '').trim().toLowerCase();
    const author = String(suggestion.authorName || '').trim().toLowerCase();
    return getBooks().find(book => String(book.title || '').trim().toLowerCase() === title && String(book.author || '').trim().toLowerCase() === author) || null;
}

function acceptSuggestionIntoCatalog(suggestion) {
    const books = getBooks();
    const copies = Math.max(1, Number(suggestion.requestedCopies || 1));
    const matched = books.find(book => String(book.title || '').trim().toLowerCase() === String(suggestion.bookName || '').trim().toLowerCase() && String(book.author || '').trim().toLowerCase() === String(suggestion.authorName || '').trim().toLowerCase());
    if (matched) {
        matched.qty = Math.max(0, Number(matched.qty || 0)) + copies;
        matched.available = Math.max(0, Number(matched.available || 0)) + copies;
        if (!matched.publisher && suggestion.publisher) matched.publisher = suggestion.publisher;
        if (!matched.category && suggestion.category) matched.category = suggestion.category;
        if (!matched.isbn && suggestion.isbn) matched.isbn = suggestion.isbn;
        saveBooks(books);
        return { catalogBookId: matched.id, catalogAction: 'UPDATED_STOCK' };
    }
    const nextIdNumber = getBooks().reduce((maxId, book) => {
        const value = Number(String(book.id || '').replace(/[^0-9]/g, ''));
        return Number.isFinite(value) ? Math.max(maxId, value) : maxId;
    }, 1000) + 1;
    const newBook = ensureBookEnhancements({
        id: `V-${nextIdNumber}`,
        title: suggestion.bookName,
        author: suggestion.authorName,
        category: suggestion.category || 'General',
        isbn: suggestion.isbn || `NA-${Date.now()}`,
        qty: copies,
        available: copies,
        publisher: suggestion.publisher || 'Suggested Title',
        edition: suggestion.edition || ''
    });
    books.push(newBook);
    saveBooks(books);
    return { catalogBookId: newBook.id, catalogAction: 'ADDED_NEW_TITLE' };
}

function reviewBookSuggestion(suggestionId, action = 'ACCEPTED', options = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can review suggestions' };
    const suggestions = normalizeLegacySuggestions();
    const index = suggestions.findIndex(item => item.suggestionId === suggestionId);
    if (index === -1) return { ok: false, message: 'Suggestion not found' };
    const normalizedAction = String(action || 'ACCEPTED').toUpperCase();
    let catalogBookId = suggestions[index].catalogBookId || '';
    let catalogAction = suggestions[index].catalogAction || '';
    if (normalizedAction === 'ACCEPTED' && options.addToCatalog) {
        const catalogResult = acceptSuggestionIntoCatalog(suggestions[index]);
        catalogBookId = catalogResult.catalogBookId;
        catalogAction = catalogResult.catalogAction;
    }
    suggestions[index] = {
        ...suggestions[index],
        status: normalizedAction === 'REJECTED' ? 'REJECTED' : 'ACCEPTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.name || currentUser.username || currentUser.role,
        reviewedByRole: currentUser.role,
        reviewRemark: options.reviewRemark || suggestions[index].reviewRemark || '',
        catalogBookId,
        catalogAction
    };
    saveBookSuggestions(suggestions);
    addNotification(`Suggestion ${suggestions[index].status.toLowerCase()} for ${suggestions[index].bookName}`, 'library');
    return { ok: true, suggestion: suggestions[index], message: suggestions[index].status === 'ACCEPTED' ? 'Suggestion accepted successfully.' : 'Suggestion rejected successfully.' };
}

function getSuggestionMetrics() {
    const suggestions = normalizeLegacySuggestions();
    return {
        total: suggestions.length,
        pending: suggestions.filter(item => item.status === 'PENDING').length,
        accepted: suggestions.filter(item => item.status === 'ACCEPTED').length,
        rejected: suggestions.filter(item => item.status === 'REJECTED').length,
        faculty: suggestions.filter(item => item.suggesterRole === 'faculty').length,
        student: suggestions.filter(item => item.suggesterRole === 'student').length
    };
}

function getFeedbackEntries() {
    const saved = localStorage.getItem(STORAGE_KEYS.feedbackEntries);
    if (!saved) return [];
    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveFeedbackEntries(entries = []) {
    localStorage.setItem(STORAGE_KEYS.feedbackEntries, JSON.stringify(entries));
    scheduleServerStateSync();
}

function getFeedbackMonthKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function shouldShowMonthlyFeedback(date = new Date()) {
    return Number(date.getDate()) === 17;
}

function hasSubmittedFeedbackForMonth(userUid, monthKey = getFeedbackMonthKey()) {
    return getFeedbackEntries().some(item => item.userUid === userUid && item.monthKey === monthKey);
}

const feedbackSection = document.getElementById("scholasticFeedback");

if (feedbackSection) {
  feedbackSection.style.display = "block";
}

function saveMonthlyFeedback(payload = {}) {
    const user = getCurrentUser();
    if (!user) return { ok: false, message: 'Please log in to submit feedback.' };
    const rating = Math.max(1, Math.min(5, Number(payload.rating || 0)));
    if (!rating) return { ok: false, message: 'Please select a star rating.' };
    const content = String(payload.content || '').trim();
    const entries = getFeedbackEntries();
    const monthKey = getFeedbackMonthKey();
    const nextEntry = {
        feedbackId: createId('FDBK'),
        userUid: user.uid,
        name: user.name || user.username || 'VEMU User',
        role: user.role || 'user',
        rating,
        content,
        monthKey,
        createdAt: new Date().toISOString()
    };
    const existingIndex = entries.findIndex(item => item.userUid === user.uid && item.monthKey === monthKey);
    if (existingIndex >= 0) entries[existingIndex] = { ...entries[existingIndex], ...nextEntry };
    else entries.unshift(nextEntry);
    saveFeedbackEntries(entries.slice(0, 40));
    localStorage.removeItem(STORAGE_KEYS.feedbackPrompt);
    return { ok: true, message: 'Feedback saved successfully.', entry: nextEntry };
}


function formatHomeLiveNumber(value, suffix = '') {
    const num = Math.max(0, Number(value || 0));
    return `${num.toLocaleString('en-IN')}${suffix}`;
}

function updateHomeLiveClock() {
    const timeNode = document.getElementById('home-live-time');
    const dateNode = document.getElementById('home-live-date');
    if (!timeNode || !dateNode) return;
    const now = new Date();
    timeNode.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    dateNode.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
}

function updateHomeLiveStats() {
    const books = getBooks();
    const users = getUsers();
    const feedback = getFeedbackEntries();
    const transactions = getTransactions();

    const physicalVolumes = books.reduce((sum, book) => sum + Math.max(0, Number(book.qty || 0)), 0);
    const digitalScholars = users.filter(user => ['student', 'faculty'].includes(String(user.role || '').toLowerCase()) && String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const feedbackCount = feedback.length;
    const activeBorrowers = transactions.filter(tx => ['ISSUED', 'OVERDUE', 'PENDING'].includes(String(tx.status || '').toUpperCase()) && !tx.returnedAt).length;

    const bindings = {
        'physical-volumes-count': formatHomeLiveNumber(physicalVolumes),
        'digital-scholars-count': formatHomeLiveNumber(digitalScholars),
        'home-feedback-count': formatHomeLiveNumber(feedbackCount),
        'home-active-borrowers-count': formatHomeLiveNumber(activeBorrowers),
        'hero-physical-volumes': formatHomeLiveNumber(physicalVolumes),
        'hero-digital-scholars': formatHomeLiveNumber(digitalScholars),
        'hero-feedback-count': formatHomeLiveNumber(feedbackCount),
        'hero-active-borrowers': formatHomeLiveNumber(activeBorrowers)
    };

    Object.entries(bindings).forEach(([id, value]) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    });

    updateHomeLiveClock();
}

function renderHomeFeedback() {
    const host = document.getElementById('scholastic-feedback-list');
    if (!host) return;
    host.style.display = 'grid';
    host.style.gap = '24px';
    const fallbackEntries = [
        { name: 'Ravi Teja', role: 'student', rating: 5, content: 'The digital library is a game changer for my research work. The IEEE access is seamless.', createdAt: new Date().toISOString() },
        { name: 'Anjali Sharma', role: 'student', rating: 5, content: 'A true sanctuary for engineers. The environment is perfect for long study sessions.', createdAt: new Date().toISOString() },
        { name: 'Dr. NagaRaj', role: 'faculty', rating: 5, content: "VEMU's library system is by far the most organized and professional I have used.", createdAt: new Date().toISOString() }
    ];
    const savedEntries = getFeedbackEntries().filter(item => item && (item.content || item.rating)).slice(0, 6);
    const entries = savedEntries.length ? savedEntries : fallbackEntries;
    host.innerHTML = entries.map((item, index) => {
        const stars = '★'.repeat(Math.max(1, Math.min(5, Number(item.rating || 0)))) + '☆'.repeat(5 - Math.max(1, Math.min(5, Number(item.rating || 0))));
        const fallback = [
            '"The digital library is a game changer for my research work. The IEEE access is seamless."',
            '"A true sanctuary for engineers. The environment is perfect for long study sessions."',
            '"VEMU\'s library system is by far the most organized and professional I\'ve used."'
        ];
        const quote = item.content ? `"${item.content}"` : fallback[index % fallback.length];
        const roleLabel = item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Library User';
        return `<div class="glass-card reveal active" style="padding: 30px; border-radius: 20px; transition-delay: ${index * 0.15}s; color: var(--text-dark);"><div style="font-size:1rem; letter-spacing:0.08em; color: var(--accent-gold); margin-bottom: 14px;">${stars}</div><p style="font-style: italic; opacity: 0.8; margin-bottom: 20px;">${quote}</p><h4 style="color: var(--accent-gold);">${item.name}</h4><span style="font-size: 0.8rem; opacity: 0.8;">${roleLabel} • ${formatDate(item.createdAt)}</span></div>`;
    }).join('');
}

function mountMonthlyFeedbackPrompt() {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'student', 'faculty', 'librarian'].includes(currentUser.role)) return;
    if (!shouldShowMonthlyFeedback()) return;
    if (hasSubmittedFeedbackForMonth(currentUser.uid)) return;
    const promptKey = `${STORAGE_KEYS.feedbackPrompt}_${currentUser.uid}_${getFeedbackMonthKey()}`;
    if (sessionStorage.getItem(promptKey)) return;
    sessionStorage.setItem(promptKey, 'shown');

    const modal = document.createElement('div');
    modal.id = 'monthly-feedback-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.55); display:flex; align-items:center; justify-content:center; padding:18px; z-index:4500;';
    modal.innerHTML = `
        <div style="width:min(560px,100%); background:white; border-radius:24px; overflow:hidden; box-shadow:0 24px 80px rgba(15,23,42,0.28); border:1px solid rgba(15,23,42,0.08);">
            <div style="padding:22px 24px; background:linear-gradient(135deg, var(--primary-slate), var(--primary-light)); color:white;">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                    <div>
                        <div style="font-size:0.8rem; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85;">Monthly Library Feedback</div>
                        <h3 style="margin-top:8px; font-size:1.2rem;">Share your VEMU library experience</h3>
                        <p style="margin-top:8px; font-size:0.84rem; opacity:0.9;">Visible on the home page after logout. Filling this form is optional.</p>
                    </div>
                    <button type="button" id="feedback-close-btn" class="btn btn-outline" style="background:white; color:var(--primary-slate); border-color:white;">Skip</button>
                </div>
            </div>
            <div style="padding:24px;">
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:18px;" id="feedback-stars">${[1,2,3,4,5].map(star => `<button type="button" data-feedback-star="${star}" style="width:48px; height:48px; border:none; border-radius:16px; background:#f8fafc; cursor:pointer; font-size:1.5rem; box-shadow:var(--shadow-soft);">☆</button>`).join('')}</div>
                <textarea id="feedback-content" class="form-control" rows="5" maxlength="280" placeholder="Write your feedback about the library, support, or digital resources (optional)" style="resize:none;"></textarea>
                <div style="display:flex; justify-content:space-between; gap:10px; margin-top:16px; flex-wrap:wrap; align-items:center;">
                    <small style="color:var(--text-muted);">Shown every month on the 17th.</small>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline" id="feedback-skip-btn">Maybe Later</button>
                        <button type="button" class="btn btn-accent" id="feedback-submit-btn"><ion-icon name="send-outline"></ion-icon> Submit Feedback</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    let rating = 0;
    const stars = modal.querySelectorAll('[data-feedback-star]');
    const paintStars = () => {
        stars.forEach(btn => {
            const active = Number(btn.dataset.feedbackStar) <= rating;
            btn.textContent = active ? '★' : '☆';
            btn.style.background = active ? 'rgba(230, 126, 34, 0.12)' : '#f8fafc';
            btn.style.color = active ? 'var(--accent-copper)' : 'var(--text-muted)';
        });
    };
    stars.forEach(btn => btn.addEventListener('click', () => { rating = Number(btn.dataset.feedbackStar); paintStars(); }));
    const closeModal = () => modal.remove();
    modal.querySelector('#feedback-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#feedback-skip-btn').addEventListener('click', closeModal);
    modal.querySelector('#feedback-submit-btn').addEventListener('click', () => {
        const result = saveMonthlyFeedback({ rating, content: modal.querySelector('#feedback-content').value });
        showToast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
            renderHomeFeedback();
            closeModal();
        }
    });
}

function getMonthlyCirculationData() {
    const txs = getTransactions().filter(tx => tx.issueDate);
    const now = new Date();
    const months = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = txs.filter(tx => String(tx.issueDate || '').slice(0, 7) === monthKey).length;
        months.push({
            key: monthKey,
            count,
            label: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).replace(' ', " '")
        });
    }
    return months;
}


function normalizeBarcodeNumber(value) {
    return String(value || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

function createBookBarcodeNumber(seed = '') {
    const base = normalizeBarcodeNumber(seed) || `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return `BC${base.slice(-10).padStart(10, '0')}`;
}

function createBookBarcodeValue(book = {}) {
    return `VEMU|${book.id || ''}|${book.barcodeNumber || ''}|${book.isbn || ''}`;
}

function ensureBookEnhancements(book = {}) {
    const normalized = { ...book };
    normalized.id = String(normalized.id || '').trim();
    normalized.title = String(normalized.title || '').trim();
    normalized.author = String(normalized.author || '').trim();
    normalized.category = String(normalized.category || '').trim();
    normalized.isbn = String(normalized.isbn || '').trim();
    normalized.publisher = String(normalized.publisher || '').trim();
    normalized.qty = Math.max(1, Number(normalized.qty || 1));
    normalized.available = Math.min(normalized.qty, Math.max(0, Number(normalized.available ?? normalized.qty)));
    normalized.barcodeNumber = normalizeBarcodeNumber(normalized.barcodeNumber) || createBookBarcodeNumber(normalized.id || normalized.isbn || normalized.title);
    normalized.barcodeValue = String(normalized.barcodeValue || createBookBarcodeValue(normalized)).trim();
    normalized.digitalCopyPrice = Math.max(0, Number(normalized.digitalCopyPrice ?? 50));
    normalized.pdfAvailable = normalized.pdfAvailable !== false;
    return normalized;
}

function getBarcodeImageUrl(bookOrValue) {
    const text = typeof bookOrValue === 'string' ? bookOrValue : (bookOrValue?.barcodeNumber || bookOrValue?.barcodeValue || '');
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(text)}&scale=3&height=12&includetext=true`;
}

function generateOfflineBarcodeSvg(book = {}) {
    const safeTitle = String(book.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeId = String(book.id || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeIsbn = String(book.isbn || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeBarcode = String(book.barcodeNumber || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const payload = String(book.barcodeNumber || book.id || 'VEMU').toUpperCase();
    let cursorX = 110;
    let bars = '';
    for (const char of payload) {
        const code = char.charCodeAt(0);
        for (let bit = 0; bit < 7; bit += 1) {
            const width = ((code >> bit) & 1) ? 4 : 2;
            bars += `<rect x="${cursorX}" y="150" width="${width}" height="120" fill="#111827" rx="0.3"/>`;
            cursorX += width + 2;
        }
        cursorX += 5;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" viewBox="0 0 900 420">
  <rect width="900" height="420" fill="white"/>
  <rect x="30" y="30" width="840" height="360" rx="18" fill="#ffffff" stroke="#d9e2ec" stroke-width="2"/>
  <text x="450" y="72" text-anchor="middle" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#243B53">VEMU Library Barcode</text>
  <text x="450" y="112" text-anchor="middle" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#102A43">${safeTitle}</text>
  <text x="450" y="138" text-anchor="middle" font-size="17" font-family="Arial, Helvetica, sans-serif" fill="#486581">Ref ID: ${safeId} | ISBN: ${safeIsbn}</text>
  ${bars}
  <text x="450" y="312" text-anchor="middle" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#243B53">${safeBarcode}</text>
  <text x="450" y="348" text-anchor="middle" font-size="16" font-family="Arial, Helvetica, sans-serif" fill="#486581">Generated on ${formatDateTime(new Date())}</text>
</svg>`;
}

async function downloadBookBarcode(bookScanValue) {
    const book = findBookByScan(bookScanValue);
    if (!book) return { ok: false, message: 'Book not found for barcode download' };
    const fileBase = `${String(book.title || 'book').replace(/[^a-z0-9]+/gi, '_')}_barcode`;
    try {
        const response = await fetch(getBarcodeImageUrl(book), { mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error('Remote barcode service unavailable');
        const blob = await response.blob();
        triggerFileDownload(`${fileBase}.png`, blob);
        return { ok: true, book, message: `Barcode downloaded for ${book.title}` };
    } catch (error) {
        const svg = generateOfflineBarcodeSvg(book);
        triggerFileDownload(`${fileBase}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        return { ok: true, book, message: `Barcode downloaded for ${book.title}` };
    }
}

function findBookByScan(value) {
    const query = String(value || '').trim();
    if (!query) return null;
    const normalized = normalizeBarcodeNumber(query);
    return getBooks().find(book =>
        String(book.id || '').toLowerCase() === query.toLowerCase() ||
        String(book.isbn || '').toLowerCase() === query.toLowerCase() ||
        normalizeBarcodeNumber(book.barcodeNumber) === normalized ||
        String(book.barcodeValue || '').toLowerCase() === query.toLowerCase()
    ) || null;
}

function pdfEscapeText(value = '') {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r?\n/g, ' ')
        .replace(/[^\x20-\x7E]/g, ' ');
}

function pdfWrapText(value = '', maxChars = 34) {
    const words = String(value ?? '-').replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
        const test = current ? `${current} ${word}` : word;
        if (test.length > maxChars && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    });
    if (current) lines.push(current);
    return lines.length ? lines : ['-'];
}

function createSimplePdfBlob(title, lines = []) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const objects = [];
    const offsets = [0];
    const pushObj = value => objects.push(value);
    const esc = pdfEscapeText;
    const content = [];
    const push = line => content.push(line);
    const setFill = (r, g, b) => push(`${r} ${g} ${b} rg`);
    const setStroke = (r, g, b) => push(`${r} ${g} ${b} RG`);
    const rect = (x, y, w, h, mode = 'f') => push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`);
    const drawLine = (x1, y1, x2, y2) => push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    const textAt = (x, y, value, size = 10, font = 'F1') => {
        push('BT');
        push(`/${font} ${size} Tf`);
        push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
        push(`(${esc(value)}) Tj`);
        push('ET');
    };
    const multiText = (x, y, value, size = 10, maxChars = 34, lineGap = 12, font = 'F1') => {
        const wrapped = pdfWrapText(value, maxChars);
        wrapped.forEach((line, idx) => textAt(x, y - (idx * lineGap), line, size, font));
        return wrapped.length;
    };

    setFill(0.95, 0.97, 0.99); rect(0, 0, pageWidth, pageHeight, 'f');
    setFill(1, 1, 1); rect(28, 46, pageWidth - 56, pageHeight - 92, 'f');
    setFill(0.09, 0.19, 0.40); rect(28, pageHeight - 150, pageWidth - 56, 90, 'f');
    setFill(1, 1, 1); textAt(46, pageHeight - 100, title || 'VEMU Library Receipt', 24, 'F2');
    textAt(46, pageHeight - 120, 'Vemu Institute of Technology - Auto generated payment summary', 9, 'F1');

    const topCardsY = pageHeight - 232;
    const cardX = 42;
    const cardW = 158;
    const cardGap = 12;
    for (let i = 0; i < 3; i += 1) {
        setFill(0.985, 0.985, 0.99); rect(cardX + (i * (cardW + cardGap)), topCardsY, cardW, 58, 'f');
        setStroke(0.87, 0.90, 0.94); rect(cardX + (i * (cardW + cardGap)), topCardsY, cardW, 58, 'S');
    }
    textAt(cardX + 12, topCardsY + 39, 'RECEIPT ID', 8, 'F2');
    textAt(cardX + 12, topCardsY + 18, lines[0] || '-', 11, 'F2');
    textAt(cardX + cardW + cardGap + 12, topCardsY + 39, 'PAID DATE', 8, 'F2');
    textAt(cardX + cardW + cardGap + 12, topCardsY + 18, (lines[5] || '-').replace('Paid Date: ', ''), 11, 'F2');
    textAt(cardX + 2 * (cardW + cardGap) + 12, topCardsY + 39, 'TRANSACTION REF', 8, 'F2');
    textAt(cardX + 2 * (cardW + cardGap) + 12, topCardsY + 18, (lines[4] || '-').replace('Transaction ID: ', ''), 11, 'F2');

    const sectionTop = pageHeight - 314;
    const leftX = 42;
    const rightX = 302;
    const panelW = 250;
    const panelH = 162;
    const rowGap = 176;
    const drawPanel = (x, y, heading) => {
        setFill(0.975, 0.98, 0.99); rect(x, y, panelW, panelH, 'f');
        setStroke(0.86, 0.90, 0.95); rect(x, y, panelW, panelH, 'S');
        setFill(0.16, 0.29, 0.47); textAt(x + 12, y + panelH - 18, heading, 10, 'F2');
        setStroke(0.86, 0.90, 0.95); drawLine(x + 12, y + panelH - 26, x + panelW - 12, y + panelH - 26);
    };
    const drawPairs = (x, y, pairs) => {
        let cursorY = y;
        pairs.forEach(([label, value]) => {
            textAt(x, cursorY, label, 8, 'F2');
            const used = multiText(x + 86, cursorY, value, 8.7, 24, 10, 'F1');
            cursorY -= Math.max(15, used * 10 + 3);
            setStroke(0.88, 0.91, 0.95); drawLine(x, cursorY + 5, x + 220, cursorY + 5);
        });
    };

    drawPanel(leftX, sectionTop, 'User Details');
    drawPanel(rightX, sectionTop, 'Payment Details');
    drawPanel(leftX, sectionTop - rowGap, 'Book / Fine Details');
    drawPanel(rightX, sectionTop - rowGap, 'Handling Details');

    const chunk = arr => arr.map(item => {
        const idx = item.indexOf(':');
        return idx === -1 ? [item, '-'] : [item.slice(0, idx), item.slice(idx + 1).trim()];
    });
    drawPairs(leftX + 12, sectionTop + panelH - 42, chunk(lines.slice(7, 13)));
    drawPairs(rightX + 12, sectionTop + panelH - 42, chunk(lines.slice(1, 7)));
    drawPairs(leftX + 12, sectionTop - rowGap + panelH - 42, chunk(lines.slice(13, 19)));
    drawPairs(rightX + 12, sectionTop - rowGap + panelH - 42, chunk(lines.slice(19, 25)));

    setFill(0.99, 0.96, 0.90); rect(42, 94, pageWidth - 84, 44, 'f');
    setStroke(0.93, 0.78, 0.33); rect(42, 94, pageWidth - 84, 44, 'S');
    textAt(52, 118, 'Note: Keep this receipt for future library reference. Details are generated from the saved project data.', 8.5, 'F2');

    const stream = content.join('\n');
    pushObj('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
    pushObj('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
    pushObj('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj');
    pushObj(`4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
    pushObj('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
    pushObj('6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj');

    let pdf = '%PDF-1.4\n';
    objects.forEach(obj => { offsets.push(pdf.length); pdf += obj + '\n'; });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
}

function triggerFileDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function parseSafeJSON(text, fallback = null) {
    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn('JSON parse failed:', error);
        return fallback;
    }
}

function downloadTextFile(filename, textContent, mimeType = 'application/json;charset=utf-8') {
    const blob = new Blob([textContent], { type: mimeType });
    triggerFileDownload(filename, blob);
}


if (!localStorage.getItem(STORAGE_KEYS.books)) {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(initialBooks));
}
if (!localStorage.getItem(STORAGE_KEYS.studentData)) {
    localStorage.setItem(STORAGE_KEYS.studentData, JSON.stringify(initialStudentData));
}
if (!localStorage.getItem(STORAGE_KEYS.transactions)) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(initialTransactions));
}
if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify([]));
}
if (!localStorage.getItem(STORAGE_KEYS.receipts)) {
    localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify([]));
}
if (!localStorage.getItem(STORAGE_KEYS.renewalRequests)) {
    localStorage.setItem(STORAGE_KEYS.renewalRequests, JSON.stringify([]));
}
localStorage.setItem(
    STORAGE_KEYS.books,
    JSON.stringify(getBooks().map(ensureBookEnhancements))
);




function buildInitialUserStore() {
    return [fixedAdminAccount, seedLibrarianAccount];
}

function buildDefaultProfile(user = {}) {
    return {
        email: user.email || '',
        phone: user.phone || '',
        phoneVerified: Boolean(user.phoneVerified || user.profileDetails?.phoneVerified),
        phoneVerifiedAt: user.phoneVerifiedAt || user.profileDetails?.phoneVerifiedAt || '',
        address: user.address || '',
        roll: user.roll || '',
        department: user.dept || '',
        designation: user.year || '',
        note: user.note || '',
        profileImage: user.profileImage || user.profileDetails?.profileImage || ''
    };
}

function ensureUserEnhancements(user = {}) {
    const fineSeed = user.role === 'student' && user.username === 'santhesh@01' ? 25 : 0;
    const profileDetails = {
        ...buildDefaultProfile(user),
        ...(user.profileDetails || {})
    };
    return {
        ...user,
        fineAmount: Number(user.fineAmount ?? fineSeed ?? 0),
        profileDetails: {
            ...buildDefaultProfile(user),
            ...(user.profileDetails || {}),
            profileImage: user.profileImage || user.profileDetails?.profileImage || ''
        }
    };
}

function ensureCoreAccounts(users) {
    const list = Array.isArray(users) ? users.map(ensureUserEnhancements) : [];
    const withoutAdmin = list.filter(u => u.uid !== fixedAdminAccount.uid && u.role !== 'admin');
    const hasSeedLibrarian = withoutAdmin.some(u => u.uid === seedLibrarianAccount.uid);
    const finalUsers = [ensureUserEnhancements(fixedAdminAccount), ...withoutAdmin];
    if (!hasSeedLibrarian) finalUsers.push(ensureUserEnhancements(seedLibrarianAccount));
    return finalUsers;
}

function getUsers() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
    return ensureCoreAccounts(users);
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(ensureCoreAccounts(users)));
    scheduleServerStateSync();
}

function seedManagedUsers() {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
    if (!current || !Array.isArray(current) || !current.length) {
        saveUsers(buildInitialUserStore());
        return;
    }
    saveUsers(current);
}
seedManagedUsers();


function getReceipts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.receipts)) || [];
}
function saveReceipts(receipts) {
    localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify(receipts));
    scheduleServerStateSync();
}

function refreshCurrentUserFromStore(uid) {
    const current = getCurrentUser();
    if (!current) return;
    const targetUid = uid || current.uid;
    const latest = getUsers().find(u => u.uid === targetUid);
    if (!latest) return;
    setCurrentUser({
        uid: latest.uid,
        id: latest.id || latest.username,
        username: latest.username,
        name: latest.name,
        role: latest.role,
        dept: latest.dept || '',
        year: latest.year || '',
        roll: latest.roll || '',
        accountId: latest.accountId || '',
        status: latest.status || 'ACTIVE',
        fineAmount: Number(latest.fineAmount || 0),
        profileDetails: latest.profileDetails || buildDefaultProfile(latest)
    });
}

function getUserByUid(uid) {
    return getUsers().find(u => u.uid === uid);
}

function getUserByAccountOrUsername(value) {
    return getUsers().find(u => u.accountId === value || u.username === value || u.id === value);
}

function updateUserProfileDetails(uid, profileUpdates = {}) {
    const currentUser = getCurrentUser();
    const users = getUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index === -1) return { ok: false, message: 'User not found' };
    const target = users[index];
    const canEdit = currentUser && (currentUser.role === 'admin' || (currentUser.role === 'librarian' && ['student', 'faculty'].includes(target.role)));
    if (!canEdit) return { ok: false, message: 'Access denied for profile update' };
    const existingPhone = String(target.profileDetails?.phone ?? target.phone ?? '').trim();
    const nextPhone = String(profileUpdates.phone ?? target.profileDetails?.phone ?? '').trim();
    const keepVerification = existingPhone && nextPhone && normalizePhoneNumber(nextPhone) === normalizePhoneNumber(existingPhone) && Boolean(target.profileDetails?.phoneVerified);
    users[index] = {
        ...target,
        roll: String(profileUpdates.roll ?? target.roll ?? '').trim(),
        profileDetails: {
            ...buildDefaultProfile(target),
            ...(target.profileDetails || {}),
            email: String(profileUpdates.email ?? target.profileDetails?.email ?? '').trim(),
            phone: nextPhone,
            phoneVerified: keepVerification,
            phoneVerifiedAt: keepVerification ? (target.profileDetails?.phoneVerifiedAt || '') : '',
            address: String(profileUpdates.address ?? target.profileDetails?.address ?? '').trim(),
            roll: String(profileUpdates.roll ?? target.profileDetails?.roll ?? target.roll ?? '').trim(),
            department: String(profileUpdates.department ?? target.profileDetails?.department ?? target.dept ?? '').trim(),
            designation: String(profileUpdates.designation ?? target.profileDetails?.designation ?? target.year ?? '').trim(),
            note: String(profileUpdates.note ?? target.profileDetails?.note ?? '').trim(),
            profileImage: String(profileUpdates.profileImage ?? target.profileDetails?.profileImage ?? target.profileImage ?? '').trim()
        },
        phone: nextPhone,
        phoneVerified: keepVerification,
        phoneVerifiedAt: keepVerification ? (target.profileDetails?.phoneVerifiedAt || '') : '',
        profileImage: String(profileUpdates.profileImage ?? target.profileDetails?.profileImage ?? target.profileImage ?? '').trim()
    };
    saveUsers(users);
    refreshCurrentUserFromStore(uid);
    return { ok: true, user: users[index] };
}

function getUserProfileDetails(uid) {
    const user = getUserByUid(uid);
    if (!user) return null;
    return {
        name: user.name,
        role: user.role,
        accountId: user.accountId,
        dept: user.dept || '',
        year: user.year || '',
        roll: user.roll || '',
        fineAmount: Number(user.fineAmount || 0),
        profileDetails: {
            ...buildDefaultProfile(user),
            ...(user.profileDetails || {}),
            profileImage: user.profileImage || user.profileDetails?.profileImage || ''
        }
    };
}

function getReceiptsForUser(uid) {
    const user = getUserByUid(uid);
    if (!user) return [];
    return getReceipts().filter(r => r.userUid === uid || r.accountId === user.accountId || r.username === user.username);
}

function getFineReceiptsForUser(uid) {
    return getReceiptsForUser(uid).filter(item => ['FINE_PAYMENT', 'RETURN_FINE'].includes(String(item.txType || '').toUpperCase()));
}

function getAllFineReceipts() {
    return getReceipts()
        .filter(item => ['student', 'faculty'].includes(String(item.role || '').toLowerCase()) && ['FINE_PAYMENT', 'RETURN_FINE'].includes(String(item.txType || '').toUpperCase()))
        .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));
}

function getUserTransactionHistory(uid) {
    const user = getUserByUid(uid) || (getCurrentUser() && getCurrentUser().uid === uid ? getCurrentUser() : null);
    if (!user) return [];
    return getTransactions()
        .filter(tx => tx.borrowerUid === uid || tx.borrowerAccountId === user.accountId || tx.borrowerUsername === user.username || tx.borrowerId === user.accountId || tx.borrowerId === user.username)
        .sort((a, b) => new Date(b.returnedAt || b.issueAt || b.issueDate || 0) - new Date(a.returnedAt || a.issueAt || a.issueDate || 0));
}

function getRenewalRequests() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.renewalRequests)) || [];
}
function saveRenewalRequests(items) {
    localStorage.setItem(STORAGE_KEYS.renewalRequests, JSON.stringify(items));
    scheduleServerStateSync();
}

function requestRenewalForCurrentUser(bookTitle, extra = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['student', 'faculty'].includes(currentUser.role)) {
        return { ok: false, message: 'Only student or faculty can request renewal' };
    }

    const user = getUserByUid(currentUser.uid) || currentUser;
    const requests = getRenewalRequests();

    const activeDuplicate = requests.find(item =>
        item.bookTitle === bookTitle &&
        item.userUid === user.uid &&
        item.status === 'PENDING'
    );

    if (activeDuplicate) {
        return { ok: false, message: `Renewal already pending for ${bookTitle}` };
    }

    const request = {
        requestId: createId('REN'),
        userUid: user.uid,
        username: user.username || '',
        accountId: user.accountId || '',
        requesterName: user.name || '',
        role: user.role || '',
        bookTitle: String(bookTitle || '').trim(),
        bookId: String(extra.bookId || '').trim(),
        barcodeNumber: String(extra.barcodeNumber || '').trim(),
        dueDate: String(extra.dueDate || '').trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        decisionAt: '',
        decisionBy: '',
        extraDays: 0
    };

    requests.unshift(request);
    saveRenewalRequests(requests);

    addNotification(`Renewal request placed by ${user.name} for ${request.bookTitle}`, 'library');
    addNotification(`Your renewal request was sent for ${request.bookTitle}`, user.uid);

    return { ok: true, request, message: `Renewal request sent for ${request.bookTitle}` };
}

function processRenewalRequest(requestId, action = 'APPROVED', extraDays = 15) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) {
        return { ok: false, message: 'Only admin or librarian can process renewal requests' };
    }

    const requests = getRenewalRequests();
    const index = requests.findIndex(item => item.requestId === requestId);
    if (index === -1) return { ok: false, message: 'Renewal request not found' };

    const request = requests[index];
    if (request.status !== 'PENDING') {
        return { ok: false, message: 'This request is already processed' };
    }

    const normalizedAction = String(action || '').toUpperCase() === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const safeExtraDays = Math.max(0, Number(extraDays || 0));

    requests[index] = {
        ...request,
        status: normalizedAction,
        decisionAt: new Date().toISOString(),
        decisionBy: currentUser.name || currentUser.username || currentUser.role,
        extraDays: normalizedAction === 'APPROVED' ? safeExtraDays : 0
    };

    saveRenewalRequests(requests);

    const user = getUserByUid(request.userUid);

    if (normalizedAction === 'APPROVED') {
        const txs = getTransactions();
        const txIndex = txs.findIndex(tx =>
            tx.status === 'ISSUED' &&
            (tx.borrowerUid === request.userUid ||
             tx.borrowerAccountId === request.accountId ||
             tx.borrowerUsername === request.username) &&
            (tx.bookTitle === request.bookTitle || tx.bookId === request.bookId)
        );

        if (txIndex !== -1) {
            const base = new Date(txs[txIndex].dueDate || new Date());
            if (!Number.isNaN(base.getTime())) {
                base.setDate(base.getDate() + safeExtraDays);
                txs[txIndex].dueDate = base.toISOString().split('T')[0];
                saveTransactions(txs);
            }
        }

        if (user && user.role === 'student') {
            const studentData = getStudentData();
            studentData.issuedBooks = (studentData.issuedBooks || []).map(book => {
                if (book.title !== request.bookTitle) return book;
                const currentDue = new Date(book.dueDate);
                if (!Number.isNaN(currentDue.getTime())) {
                    currentDue.setDate(currentDue.getDate() + safeExtraDays);
                    return { ...book, dueDate: formatDate(currentDue), status: 'Extended' };
                }
                return { ...book, status: 'Extended' };
            });

            studentData.notifications = [
                `Renewal approved for ${request.bookTitle}. Added ${safeExtraDays} days.`,
                ...(studentData.notifications || [])
            ].slice(0, 100);

            saveStudentData(studentData);
        }

        addNotification(`Renewal approved for ${request.requesterName} - ${request.bookTitle}`, 'library');
        addNotification(`Your renewal was approved for ${request.bookTitle}. Added ${safeExtraDays} days.`, request.userUid);

        if (request.userUid) {
            const txsLatest = getTransactions();
            const activeRenewedTx = txsLatest.find(tx =>
                tx.status === 'ISSUED' &&
                tx.borrowerUid === request.userUid &&
                (tx.bookTitle === request.bookTitle || tx.bookId === request.bookId)
            );

            sendSmsAlertToUser(request.userUid, 'renewalApproved', {
                bookTitle: request.bookTitle,
                dueDate: activeRenewedTx?.dueDate || ''
            }).catch(() => {});
        }

        syncLibraryServerState().then(() => queueReminderSweep()).catch(() => {});
    } else {
        if (user && user.role === 'student') {
            const studentData = getStudentData();
            studentData.notifications = [
                `Renewal rejected for ${request.bookTitle}. Please return or contact library.`,
                ...(studentData.notifications || [])
            ].slice(0, 100);

            saveStudentData(studentData);
        }

        addNotification(`Renewal rejected for ${request.requesterName} - ${request.bookTitle}`, 'library');
        addNotification(`Your renewal was rejected for ${request.bookTitle}. Please contact library.`, request.userUid);
    }

    return {
        ok: true,
        request: requests[index],
        message: normalizedAction === 'APPROVED'
            ? `Renewal approved for ${request.requesterName}`
            : `Renewal rejected for ${request.requesterName}`
    };
}


function getDashboardMetrics() {
    const users = getUsers();
    const books = getBooks();
    const txs = getTransactions();
    const issued = txs.filter(tx => tx.status === 'ISSUED');
    const returned = txs.filter(tx => tx.status === 'RETURNED');
    const today = new Date().toISOString().split('T')[0];
    const issuedToday = issued.filter(tx => String(tx.issueDate || '').startsWith(today)).length;
    const returnedToday = returned.filter(tx => String(tx.returnedAt || '').startsWith(today)).length;
    const overdueAlerts = issued.filter(tx => new Date(tx.dueDate) < new Date(today)).length;
    return {
        totalInventory: books.reduce((sum, book) => sum + Number(book.qty || 0), 0),
        inCirculation: issued.length,
        registeredScholars: users.filter(u => ['student', 'faculty', 'librarian'].includes(u.role)).length,
        pendingReturns: overdueAlerts,
        issuedToday,
        returnedToday,
        overdueAlerts,
        activeTransactions: issued.slice(0, 6),
        renewalRequests: getRenewalRequests().slice(0, 10)
    };
}

function buildUpiPaymentString(amount) {
    return `upi://pay?pa=omkarvinayaka@okaxis&pn=Omkar Vinayaka&am=${Number(amount || 0).toFixed(2)}&cu=INR&tn=VEMU Library Fine`;
}

function getQrImageUrl(amount, providerIndex = 0) {
    const payload = encodeURIComponent(buildUpiPaymentString(amount));
    const providers = [
        `https://quickchart.io/qr?text=${payload}&size=220`,
        `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${payload}`,
        `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${payload}`
    ];
    return providers[providerIndex] || providers[0];
}

function applyQrImage(imgElement, amount) {
    if (!imgElement) return;
    const safeAmount = Math.max(0.01, Number(amount || 0.01));
    let providerIndex = 0;
    const loadQr = () => {
        imgElement.src = getQrImageUrl(safeAmount, providerIndex) + `&t=${Date.now()}`;
    };
    imgElement.onerror = () => {
        providerIndex += 1;
        if (providerIndex < 3) {
            loadQr();
            return;
        }
        imgElement.alt = 'QR not loaded';
    };
    loadQr();
}

function markFinePaidForCurrentUser(paymentMeta = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['student', 'faculty'].includes(currentUser.role)) return { ok: false, message: 'Payment allowed only for student or faculty accounts' };
    const users = getUsers();
    const index = users.findIndex(u => u.uid === currentUser.uid);
    if (index === -1) return { ok: false, message: 'User account not found' };
    const amount = Number(users[index].fineAmount || 0);
    if (amount <= 0) return { ok: false, message: 'No pending fine for this account' };
    const transactionId = String(paymentMeta.transactionId || paymentMeta.referenceId || '').trim();
    if (!transactionId) return { ok: false, message: 'Transaction ID is required after payment' };
    const receipts = getReceipts();
    const duplicatePending = receipts.find(item => item.userUid === users[index].uid && String(item.transactionId || '').toLowerCase() === transactionId.toLowerCase() && item.verificationStatus === 'PENDING');
    if (duplicatePending) return { ok: false, message: 'This transaction ID is already submitted for verification' };
    const receipt = {
        receiptId: createId('RCP'),
        txType: 'FINE_PAYMENT',
        userUid: users[index].uid,
        accountId: users[index].accountId || '',
        username: users[index].username || '',
        name: users[index].name || '',
        role: users[index].role || '',
        amount,
        upiId: 'omkarvinayaka@okaxis',
        transactionId,
        paidAt: new Date().toISOString(),
        note: 'Library fine payment',
        verificationStatus: 'PENDING',
        verifiedBy: '',
        verifiedAt: ''
    };
    receipts.unshift(receipt);
    saveReceipts(receipts);
    addNotification(`Fine payment submitted by ${users[index].name} for verification`, 'library');
    refreshCurrentUserFromStore(users[index].uid);
    return { ok: true, receipt, message: `Payment submitted for verification of ₹${amount.toFixed(2)}` };
}

function updateFineReceiptVerification(receiptId, action = 'RECEIVED') {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can verify payments' };
    const receipts = getReceipts();
    const receiptIndex = receipts.findIndex(item => item.receiptId === receiptId);
    if (receiptIndex === -1) return { ok: false, message: 'Receipt not found' };
    const receipt = receipts[receiptIndex];
    const normalizedAction = String(action || 'RECEIVED').toUpperCase() === 'RECEIVED' ? 'RECEIVED' : 'NOT_RECEIVED';
    receipts[receiptIndex] = {
        ...receipt,
        verificationStatus: normalizedAction,
        verifiedBy: currentUser.name || currentUser.username || currentUser.role,
        verifiedAt: new Date().toISOString()
    };
    saveReceipts(receipts);
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === receipt.userUid || u.accountId === receipt.accountId || u.username === receipt.username);
    if (userIndex !== -1) {
        const currentFine = Number(users[userIndex].fineAmount || 0);
        const amount = Number(receipt.amount || 0);
        if (normalizedAction === 'RECEIVED') users[userIndex].fineAmount = Math.max(0, currentFine - amount);
        else users[userIndex].fineAmount = Math.max(currentFine, amount);
        saveUsers(users);
        refreshCurrentUserFromStore(users[userIndex].uid);
        addNotification(`Fine receipt ${normalizedAction === 'RECEIVED' ? 'approved' : 'kept pending'} for ${users[userIndex].name}`, 'library');
        if (normalizedAction === 'RECEIVED') sendSmsAlertToUser(users[userIndex].uid, 'finePaid', { amount }).catch(() => {});
        else if (Number(receipt.amount || 0) > 0) sendSmsAlertToUser(users[userIndex].uid, 'fineAdded', { amount: Number(receipt.amount || 0) }).catch(() => {});
    }
    syncLibraryServerState().then(() => queueReminderSweep()).catch(() => {});
    return { ok: true, receipt: receipts[receiptIndex], message: normalizedAction === 'RECEIVED' ? 'Payment marked as received and fine updated' : 'Marked as not received. Fine remains pending' };
}

function getTransactionBorrower(tx) {
    if (!tx) return null;
    return getUsers().find(u =>
        (u.accountId || '') === (tx.borrowerId || '') ||
        (u.username || '') === (tx.borrowerId || '') ||
        (u.id || '') === (tx.borrowerId || '') ||
        (u.accountId || '') === (tx.borrowerAccountId || '') ||
        (u.uid || '') === (tx.borrowerUid || '')
    ) || null;
}

function borrowerMatchesTransaction(tx, borrowerQuery = '') {
    const query = String(borrowerQuery || '').trim().toLowerCase();
    if (!query) return true;
    const borrower = getTransactionBorrower(tx);
    const candidates = [
        tx.borrowerId,
        tx.borrowerName,
        tx.borrowerAccountId,
        tx.borrowerUid,
        borrower?.accountId,
        borrower?.username,
        borrower?.id,
        borrower?.name,
        borrower?.roll,
        borrower?.profileDetails?.roll
    ].filter(Boolean).map(v => String(v).trim().toLowerCase());
    return candidates.includes(query);
}

function previewReturnById(bookId, options = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can process returns' };
    const transactions = getTransactions();
    const matchedBook = findBookByScan(bookId);
    const borrowerQuery = String(options.borrowerQuery || '').trim();
    const activeIndex = transactions.findIndex(tx => (
        (tx.bookId === (matchedBook?.id || bookId) || normalizeBarcodeNumber(tx.barcodeNumber) === normalizeBarcodeNumber(bookId)) &&
        tx.status === 'ISSUED' &&
        borrowerMatchesTransaction(tx, borrowerQuery)
    ));
    if (activeIndex === -1) return { ok: false, message: borrowerQuery ? 'No active issue found for this book and borrower' : 'No active issue found for this book' };
    const tx = transactions[activeIndex];
    const due = new Date(tx.dueDate);
    const now = new Date();
    const lateDays = Math.max(0, Math.ceil((now - due) / (1000 * 60 * 60 * 24)));
    const overdueFine = lateDays * 5;
    const isDamaged = Boolean(options.isDamaged);
    const damageFine = Math.max(0, Number(options.damageFine || 0));
    const totalFine = overdueFine + damageFine;
    const borrower = getTransactionBorrower(tx);
    return {
        ok: true,
        tx,
        borrower,
        overdueFine,
        damageFine,
        totalFine,
        lateDays,
        message: totalFine > 0 ? `Payment required: ₹${totalFine.toFixed(2)}` : 'Return can be processed now'
    };
}

function getReceiptDisplayRecord(receipt = {}) {
    const record = { ...(receipt || {}) };
    const users = getUsers();
    const transactions = getTransactions();
    const books = getBooks();
    const matchedUser = users.find(user =>
        user.uid === record.userUid ||
        (record.accountId && (user.accountId || '') === record.accountId) ||
        (record.username && (user.username || '') === record.username)
    ) || null;
    const matchedTx = transactions.find(tx =>
        (record.transactionId && tx.txId === record.transactionId) ||
        (record.bookId && tx.bookId === record.bookId && ((tx.borrowerUid || '') === (record.userUid || '') || (tx.borrowerId || '') === (record.accountId || '') || (tx.borrowerUsername || '') === (record.username || '')))
    ) || null;
    const matchedBook = books.find(book =>
        (record.bookId && book.id === record.bookId) ||
        (record.barcodeNumber && normalizeBarcodeNumber(book.barcodeNumber) === normalizeBarcodeNumber(record.barcodeNumber)) ||
        (matchedTx && book.id === matchedTx.bookId)
    ) || null;
    const profile = matchedUser?.profileDetails || {};
    const paidDate = record.paidAt ? new Date(record.paidAt) : new Date();
    const fallbackPurpose = String(record.txType || '').toUpperCase() === 'RETURN_FINE'
        ? `Return fine payment${Number(record.damageFine || 0) > 0 ? ' with damage issue' : ''}`
        : 'Library fine payment';
    return {
        ...record,
        fullName: record.fullName || record.name || matchedUser?.name || '-',
        username: record.username || matchedUser?.username || '-',
        accountId: record.accountId || matchedUser?.accountId || '-',
        role: record.role || matchedUser?.role || '-',
        department: record.department || profile.dept || matchedUser?.dept || '-',
        year: record.year || profile.year || matchedUser?.year || '-',
        phone: record.phone || profile.phone || matchedUser?.phone || '-',
        email: record.email || profile.email || matchedUser?.email || '-',
        bookId: record.bookId || matchedTx?.bookId || matchedBook?.id || '-',
        bookTitle: record.bookTitle || matchedTx?.bookTitle || matchedBook?.title || '-',
        barcodeNumber: record.barcodeNumber || matchedTx?.barcodeNumber || matchedBook?.barcodeNumber || '-',
        transactionId: record.transactionId || '-',
        upiId: record.upiId || 'omkarvinayaka@okaxis',
        paidDateText: paidDate.toLocaleDateString('en-GB'),
        paidTimeText: paidDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        verificationStatus: record.verificationStatus || 'PENDING',
        paymentFor: record.paymentFor || record.note || fallbackPurpose,
        acceptedBy: record.verifiedBy || record.processedBy || '-',
        verifiedDateText: record.verifiedAt ? formatDate(record.verifiedAt) : '-',
        verifiedTimeText: record.verifiedAt ? new Date(record.verifiedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-'
    };
}

function createReceiptPrintHtml(receipt = {}) {
    const item = getReceiptDisplayRecord(receipt);
    const esc = value => String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const barcodeSvg = generateOfflineBarcodeSvg({
        title: item.bookTitle,
        id: item.bookId,
        isbn: item.transactionId,
        barcodeNumber: item.barcodeNumber
    });
    const barcodeData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(barcodeSvg)}`;
    const statusTone = item.verificationStatus === 'RECEIVED' ? '#f97316' : (item.verificationStatus === 'NOT_RECEIVED' ? '#ef4444' : '#f59e0b');
    return `
<div id="receipt-pdf-root" style="width:880px;background:linear-gradient(90deg,#eef3f9 0%,#eef3f9 35%,#f6f0e9 35%,#f6f0e9 100%);padding:30px;font-family:Arial,Helvetica,sans-serif;color:#22324d;">
  <div style="width:520px;margin:0 auto;background:#fbfcfe;border:1px solid #d7e0ea;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
    <div style="background:linear-gradient(90deg,#102d69 0%,#173d8f 55%,#f07818 100%);padding:18px 18px 14px;color:#fff;position:relative;">
      <div style="font-size:14px;font-weight:800;line-height:1.1;">VEMU Library Receipt</div>
      <div style="font-size:8px;opacity:.92;margin-top:3px;">Vemu Institute of Technology - Payment acknowledgement</div>
      <div style="position:absolute;right:14px;top:12px;background:rgba(255,255,255,.24);padding:6px 10px;border-radius:999px;font-size:8px;font-weight:700;letter-spacing:.04em;">${esc(item.verificationStatus)}</div>
    </div>
    <div style="padding:16px;">
      <div style="display:grid;grid-template-columns:1.45fr .95fr;gap:10px;">
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:#fff;">
          <div style="font-weight:800;font-size:12px;color:#192c4a;">Payment Receipt</div>
          <div style="font-size:8.5px;line-height:1.55;color:#5f6f84;margin-top:8px;">This receipt confirms the library payment entry recorded in the system. It includes user details, payment purpose, transaction details, and verification information.</div>
        </div>
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:linear-gradient(180deg,#fff,#fbf6ef);text-align:center;">
          <div style="font-size:8px;font-weight:700;color:#697a91;letter-spacing:.04em;">AMOUNT PAID</div>
          <div style="font-size:24px;font-weight:800;color:#102d69;margin-top:8px;">₹ ${Number(item.amount || 0).toFixed(2)}</div>
          <div style="font-size:8px;color:#7b8aa0;margin-top:10px;">Receipt ID: ${esc(item.receiptId || '-')}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:#f9fbfd;">
          <div style="font-weight:800;font-size:10px;color:#284a84;margin-bottom:8px;">User Details</div>
          ${receiptRow('FULL NAME', esc(item.fullName))}
          ${receiptRow('USERNAME', esc(item.username))}
          ${receiptRow('ROLE', esc(item.role))}
          ${receiptRow('ACCOUNT ID', esc(item.accountId))}
        </div>
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:#f9fbfd;">
          <div style="font-weight:800;font-size:10px;color:#284a84;margin-bottom:8px;">Payment Details</div>
          ${receiptRow('PAYMENT TYPE', esc(item.txType || 'FINE_PAYMENT'))}
          ${receiptRow('PAID FOR', esc(item.paymentFor))}
          ${receiptRow('UPI ID', esc(item.upiId))}
          ${receiptRow('TRANSACTION ID', esc(item.transactionId))}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;align-items:stretch;">
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:#f9fbfd;">
          <div style="font-weight:800;font-size:10px;color:#284a84;margin-bottom:8px;">Book / Fine Details</div>
          ${receiptRow('BOOK ID', esc(item.bookId))}
          ${receiptRow('BOOK TITLE', esc(item.bookTitle))}
          ${receiptRow('BARCODE NUMBER', esc(item.barcodeNumber))}
          ${receiptRow('REMARKS', esc(item.note || item.paymentFor || '-'))}
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            ${miniStat('OVERDUE FINE', '₹ ' + Number(item.overdueFine || 0).toFixed(2))}
            ${miniStat('DAMAGE FINE', '₹ ' + Number(item.damageFine || 0).toFixed(2))}
            ${miniStat('TOTAL PAID', '₹ ' + Number(item.amount || 0).toFixed(2))}
          </div>
        </div>
        <div style="border:1px solid #d9e1ea;border-radius:14px;padding:12px;background:#f9fbfd;">
          <div style="font-weight:800;font-size:10px;color:#284a84;margin-bottom:8px;">Date & Handling Details</div>
          ${receiptRow('PAID DATE', esc(item.paidDateText))}
          ${receiptRow('PAID TIME', esc(item.paidTimeText))}
          ${receiptRow('ACCEPTED / ATTENDED BY', esc(item.acceptedBy))}
          ${receiptRow('VERIFIED DATE', esc(item.verifiedDateText))}
          ${receiptRow('VERIFIED TIME', esc(item.verifiedTimeText))}
          <div style="margin-top:12px;text-align:center;border:1px dashed #ccd7e4;border-radius:12px;padding:10px;background:#fff;">
            <div style="font-size:8px;font-weight:700;color:#7a8aa0;margin-bottom:8px;">BOOK BARCODE REFERENCE</div>
            <img src="${barcodeData}" alt="Book Barcode" style="max-width:100%;height:66px;object-fit:contain;background:#fff;">
            <div style="font-size:9px;font-weight:700;color:#22324d;margin-top:8px;">${esc(item.barcodeNumber)}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;border:1px solid #efd18a;border-radius:12px;padding:10px 12px;background:#fff8dc;font-size:8.5px;color:#435268;"> <strong>Note:</strong> Keep this receipt for future library reference. The details above are auto-generated from the current project data.</div>
    </div>
  </div>
</div>`;
}

function receiptRow(label, value) {
    return `<div style="display:grid;grid-template-columns:88px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid #dce4ed;align-items:start;"><div style="font-size:8px;font-weight:700;color:#66778f;">${label}</div><div style="font-size:9px;font-weight:700;color:#1f2f47;line-height:1.3;word-break:break-word;">${value}</div></div>`;
}

function miniStat(label, value) {
    return `<div style="border:1px solid #d5dde7;border-radius:12px;padding:8px;background:#fff;"><div style="font-size:8px;color:#74849a;font-weight:700;line-height:1.15;">${label}</div><div style="font-size:10px;font-weight:800;color:#102d69;margin-top:6px;">${value}</div></div>`;
}

function loadJsPdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (window.__jspdfLoadingPromise) return window.__jspdfLoadingPromise;
    window.__jspdfLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
            else reject(new Error('jsPDF not available after load'));
        };
        script.onerror = () => reject(new Error('Unable to load jsPDF library'));
        document.head.appendChild(script);
    });
    return window.__jspdfLoadingPromise;
}

function openReceiptPrintWindow(receipt = {}) {
    const item = getReceiptDisplayRecord(receipt);
    const fileBase = String(item.receiptId || 'library_receipt').replace(/[^a-z0-9_-]+/gi, '_');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Please allow popups for receipt print preview.', 'warning');
        return false;
    }
    const receiptHtml = createReceiptPrintHtml(item);
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileBase}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#edf3fa,#f7f1e8);color:#1f2f47}
  .receipt-print-shell{min-height:100vh;padding:24px 18px 34px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
  .receipt-print-actions{width:min(920px,100%);display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:16px}
  .receipt-print-btn{border:none;border-radius:999px;padding:12px 18px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 10px 24px rgba(15,23,42,.12)}
  .receipt-print-btn.primary{background:linear-gradient(90deg,#102d69,#f07818);color:#fff}
  .receipt-print-btn.secondary{background:#fff;color:#102d69;border:1px solid #d5dfeb}
  .receipt-print-note{width:min(920px,100%);margin:0 auto 16px;background:rgba(255,255,255,.72);border:1px solid #d8e3ef;padding:10px 14px;border-radius:14px;color:#55657c;font-size:13px;line-height:1.5}
  @page{size:A4;margin:12mm}
  @media print{
    body{background:#fff}
    .receipt-print-shell{padding:0;min-height:auto}
    .receipt-print-actions,.receipt-print-note{display:none !important}
    #receipt-pdf-root{padding:0 !important;background:#fff !important}
  }
  @media (max-width:680px){
    .receipt-print-shell{padding:14px 10px 22px}
    .receipt-print-actions{justify-content:center}
    .receipt-print-btn{width:100%;justify-content:center}
  }
</style>
</head>
<body>
  <div class="receipt-print-shell">
    <div class="receipt-print-actions">
      <button class="receipt-print-btn secondary" onclick="window.close()">Close</button>
      <button class="receipt-print-btn primary" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="receipt-print-note">Use <strong>Print / Save as PDF</strong> to keep this receipt. You can open and print this receipt any number of times after it is marked as <strong>Received</strong>.</div>
    ${receiptHtml}
  </div>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){ try { window.focus(); window.print(); } catch (e) {} }, 450);
    });
  <\/script>
</body>
</html>`);
    printWindow.document.close();
    return true;
}

function downloadReceiptPdf(receipt = {}) {
    const item = getReceiptDisplayRecord(receipt);
    if (String(item.verificationStatus || '').toUpperCase() !== 'RECEIVED') {
        showToast('Receipt download is available only after admin or librarian marks it as received.', 'warning');
        return;
    }
    openReceiptPrintWindow(item);
}

function generateBarcodeDataUrl(value = '') {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(value || '-'), {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false
    });
    return canvas.toDataURL("image/png");
}

async function ensureJsPdfLoaded() {
    if (window.jspdf && window.jspdf.jsPDF) return true;

    const existing = document.querySelector('script[data-jspdf-loader="true"]');
    if (existing) {
        await new Promise((resolve, reject) => {
            if (window.jspdf && window.jspdf.jsPDF) return resolve(true);
            existing.addEventListener('load', () => resolve(true), { once: true });
            existing.addEventListener('error', () => reject(new Error('jsPDF failed to load')), { once: true });
        });
        return !!(window.jspdf && window.jspdf.jsPDF);
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    script.dataset.jspdfLoader = 'true';

    await new Promise((resolve, reject) => {
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('jsPDF failed to load'));
        document.head.appendChild(script);
    });

    return !!(window.jspdf && window.jspdf.jsPDF);
}

function generateInventoryBarcodeDataUrl(value = '') {
    const safeValue = String(value || '').trim();
    if (!safeValue || typeof JsBarcode === 'undefined') return '';

    const canvas = document.createElement('canvas');
    JsBarcode(canvas, safeValue, {
        format: 'CODE128',
        width: 1.5,
        height: 36,
        displayValue: false,
        margin: 0
    });

    return canvas.toDataURL('image/png');
}

function expandInventoryBooksForPdf(books = []) {
    const rows = [];

    (Array.isArray(books) ? books : []).forEach(book => {
        const totalCopies = Math.max(1, Number(book.qty || 1));
        for (let copyIndex = 1; copyIndex <= totalCopies; copyIndex += 1) {
            rows.push({
    refId: String(book.id || '-'),
    title: String(book.title || '-'),
    author: String(book.author || '-'),
    barcodeNumber: String(book.barcodeNumber || '-'),
    barcodeImage: generateInventoryBarcodeDataUrl(book.barcodeNumber || ''),
    copyLabel: `${copyIndex}/${totalCopies}`
});
        }
    });

    return rows;
}

async function downloadInventorySnapshotPdf(books = [], options = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(String(currentUser.role || '').toLowerCase())) {
        return { ok: false, message: 'Only admin or librarian can download inventory PDF' };
    }

   const jspdfReady = await ensureJsPdfLoaded();
if (!jspdfReady || !window.jspdf || !window.jspdf.jsPDF) {
    return { ok: false, message: 'jsPDF not loaded' };
}

    const expandedRows = expandInventoryBooksForPdf(books);
    if (!expandedRows.length) {
        return { ok: false, message: 'No books available for export' };
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 10;
    const marginTop = 12;
    const rowHeight = 20;
    const barcodeWidth = 42;
    const barcodeHeight = 10;

    let y = marginTop;

    function drawHeader(pageNo) {
        doc.setFillColor(28, 48, 74);
        doc.rect(0, 0, pageWidth, 18, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(String(options.title || 'Inventory Snapshot'), marginLeft, 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Generated on ${formatDateTime(new Date())}`, marginLeft, 16);
        doc.text(`Page ${pageNo}`, pageWidth - 22, 16);

        y = 24;
    }

    function drawColumnHeader() {
        doc.setFillColor(230, 236, 245);
        doc.rect(marginLeft, y, pageWidth - 2 * marginLeft, 8, 'F');

        doc.setTextColor(25, 25, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);

        doc.text('Ref ID', marginLeft + 2, y + 5);
        doc.text('Book Name', marginLeft + 24, y + 5);
        doc.text('Author', marginLeft + 92, y + 5);
        doc.text('Barcode', marginLeft + 138, y + 5);
        doc.text('Copy', marginLeft + 182, y + 5);

        y += 10;
    }

    function ensureSpace() {
        if (y + rowHeight > pageHeight - 12) {
            doc.addPage();
            drawHeader(doc.getNumberOfPages());
            drawColumnHeader();
        }
    }

    function fitText(value = '', maxLen = 28) {
        const raw = String(value || '-').trim();
        return raw.length > maxLen ? `${raw.slice(0, maxLen - 3)}...` : raw;
    }

    drawHeader(1);
    drawColumnHeader();

    expandedRows.forEach((row, index) => {
        ensureSpace();

        if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(marginLeft, y - 2, pageWidth - 2 * marginLeft, rowHeight - 2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);

        doc.text(fitText(row.refId, 12), marginLeft + 2, y + 5);
        doc.text(fitText(row.title, 34), marginLeft + 24, y + 5);
        doc.text(fitText(row.author, 26), marginLeft + 92, y + 5);

        if (row.barcodeImage) {
            try {
                doc.addImage(row.barcodeImage, 'PNG', marginLeft + 136, y, barcodeWidth, barcodeHeight);
            } catch (error) {
                doc.text(fitText(row.barcodeNumber, 18), marginLeft + 138, y + 5);
            }
        } else {
            doc.text(fitText(row.barcodeNumber, 18), marginLeft + 138, y + 5);
        }

        doc.text(fitText(row.copyLabel, 8), marginLeft + 182, y + 5);

        y += rowHeight;
    });

    const safeTitle = String(options.title || 'inventory_snapshot')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');

    doc.save(`${safeTitle || 'inventory_snapshot'}.pdf`);

    return {
        ok: true,
        count: expandedRows.length,
        message: `Inventory PDF downloaded with ${expandedRows.length} book copies`
    };
}

function getBooks() {
    const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.books)) || [];
    return Array.isArray(books) ? books.map(ensureBookEnhancements) : [];
}
function saveBooks(books) {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify((Array.isArray(books) ? books : []).map(ensureBookEnhancements)));
    scheduleServerStateSync();
}

function getStudentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.studentData)) || initialStudentData;
}
function saveStudentData(data) {
    localStorage.setItem(STORAGE_KEYS.studentData, JSON.stringify(data));
    scheduleServerStateSync();
}
function getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions)) || [];
}
function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    scheduleServerStateSync();
}

function getNotifications() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications)) || [];
}
function saveNotifications(items) {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(items));
    scheduleServerStateSync();
}

function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        return user || null;
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function addNotification(message, scope = 'global') {
    const items = getNotifications();
    items.unshift({
        id: createId('NTF'),
        message,
        scope,
        createdAt: new Date().toISOString()
    });
    saveNotifications(items.slice(0, 500));
}

function getNotificationsForUser(userOrUid = null, limit = 10) {
    const current = userOrUid
        ? (typeof userOrUid === 'string' ? getUserByUid(userOrUid) || { uid: userOrUid } : userOrUid)
        : getCurrentUser();

    if (!current) return [];

    const currentUid = String(current.uid || '').trim();
    const currentRole = String(current.role || '').trim().toLowerCase();

    return getNotifications()
        .filter(item => {
            const scope = String(item.scope || '').trim();

            if (!scope) return false;
            if (scope === 'global') return true;
            if (scope === currentUid) return true;

            if (currentRole === 'admin' && (scope === 'admin' || scope === 'library')) return true;
            if (currentRole === 'librarian' && (scope === 'librarian' || scope === 'library')) return true;
            if (currentRole === 'student' && scope === 'student') return true;
            if (currentRole === 'faculty' && scope === 'faculty') return true;

            if (currentRole === 'librarian' && ['librarian', 'library'].includes(scope)) return true;

            return false;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit);
}

function canManageRole(managerRole, targetRole) {
    if (managerRole === 'admin') return ['student', 'faculty', 'librarian'].includes(targetRole);
    if (managerRole === 'librarian') return ['student', 'faculty'].includes(targetRole);
    return false;
}

function getManageableUsers(viewerRole) {
    return getUsers().filter(u => canManageRole(viewerRole, u.role));
}

function normalizeManagedUser(payload, manager) {
    const role = (payload.role || '').toLowerCase();
    return ensureUserEnhancements({
        uid: payload.uid || createId(`user-${role}`),
        id: payload.username.trim(),
        username: payload.username.trim(),
        pin: payload.pin.trim(),
        role,
        name: payload.name.trim(),
        dept: (payload.dept || '').trim(),
        year: (payload.year || '').trim(),
        roll: payload.roll ? payload.roll.trim() : '',
        accountId: payload.accountId.trim(),
        status: payload.status || 'ACTIVE',
        fineAmount: Number(payload.fineAmount || 0),
        profileDetails: payload.profileDetails || buildDefaultProfile(payload),
        createdByRole: manager?.role || '',
        createdByName: manager?.name || ''
    });
}

function validateManagedUser(payload, managerRole, isUpdate = false) {
    if (!payload.name?.trim()) return { ok: false, message: 'Name is required' };
    if (!payload.role) return { ok: false, message: 'Role is required' };
    if (!canManageRole(managerRole, payload.role)) return { ok: false, message: 'You do not have permission for this role' };
    if (!payload.accountId?.trim()) return { ok: false, message: 'Account ID is required' };
    if (!payload.username?.trim()) return { ok: false, message: 'Username is required' };
    if (!payload.pin?.trim()) return { ok: false, message: 'Password is required' };
    if (isUpdate && !payload.uid) return { ok: false, message: 'Account key missing' };

    const users = getUsers();
    const usernameTaken = users.some(u => u.username === payload.username.trim() && u.uid !== payload.uid);
    if (usernameTaken) return { ok: false, message: 'Username already exists' };
    const accountTaken = users.some(u => (u.accountId || '').toLowerCase() === payload.accountId.trim().toLowerCase() && u.uid !== payload.uid);
    if (accountTaken) return { ok: false, message: 'Account ID already exists' };
    return { ok: true };
}

function adminCreateManagedUser(payload) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Unauthorized action' };
    const valid = validateManagedUser(payload, currentUser.role, false);
    if (!valid.ok) return valid;
    const users = getUsers();
    const user = normalizeManagedUser(payload, currentUser);
    users.push(user);
    saveUsers(users);
    addNotification(`New ${user.role} account created for ${user.name}`, 'admin');
    return { ok: true, user };
}

function adminUpdateManagedUser(payload) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Unauthorized action' };
    const users = getUsers();
    const existing = users.find(u => u.uid === payload.uid);
    if (!existing) return { ok: false, message: 'User not found' };
    if (!canManageRole(currentUser.role, existing.role)) return { ok: false, message: 'You do not have permission to edit this account' };
    const valid = validateManagedUser(payload, currentUser.role, true);
    if (!valid.ok) return valid;
    const index = users.findIndex(u => u.uid === payload.uid);
    users[index] = ensureUserEnhancements({
        ...normalizeManagedUser(payload, currentUser),
        uid: existing.uid,
        fineAmount: Number(existing.fineAmount || payload.fineAmount || 0),
        profileDetails: {
            ...buildDefaultProfile(existing),
            ...(existing.profileDetails || {}),
            ...(payload.profileDetails || {})
        },
        createdByRole: existing.createdByRole || currentUser.role,
        createdByName: existing.createdByName || currentUser.name
    });
    saveUsers(users);
    refreshCurrentUserFromStore(existing.uid);
    addNotification(`Account updated for ${users[index].name}`, 'admin');
    return { ok: true, user: users[index] };
}

function adminDeleteManagedUser(uid) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Unauthorized action' };
    const users = getUsers();
    const target = users.find(u => u.uid === uid);
    if (!target) return { ok: false, message: 'User not found' };
    if (!canManageRole(currentUser.role, target.role)) return { ok: false, message: 'You do not have permission to remove this account' };
    saveUsers(users.filter(u => u.uid !== uid));
    addNotification(`Account removed for ${target.name}`, 'admin');
    return { ok: true };
}

function handleLogin(e) {
    e.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value.trim();
    const roleVal = window.currentRole || 'student';
    const users = getUsers();

    if (!userVal || !passVal) {
        showToast('Enter username and password', 'error');
        return;
    }

    let user = null;
    if (roleVal === 'admin') {
        if (userVal !== fixedAdminAccount.username || passVal !== fixedAdminAccount.pin) {
            showToast('Invalid admin credentials', 'error');
            return;
        }
        user = fixedAdminAccount;
    } else {
        user = users.find(u => u.role === roleVal && u.username === userVal && u.pin === passVal);
        if (!user) {
            showToast(`Invalid ${roleVal} credentials`, 'error');
            return;
        }
        if (String(user.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
            showToast('This account is pending approval. Login allowed only for active users.', 'error');
            return;
        }
    }

    setCurrentUser({
        uid: user.uid,
        id: user.id || user.username,
        username: user.username,
        name: user.name,
        role: user.role,
        dept: user.dept || '',
        year: user.year || '',
        roll: user.roll || '',
        accountId: user.accountId || '',
        status: user.status || 'ACTIVE',
        fineAmount: Number(user.fineAmount || 0),
        profileDetails: user.profileDetails || buildDefaultProfile(user)
    });

    showToast(`Welcome ${user.name}`, 'success');
    setTimeout(() => {
    if (user.role === 'admin') {
        window.top.location.href = '/admin/dashboard';
    } else if (user.role === 'librarian') {
        window.top.location.href = '/librarian/dashboard';
    } else if (user.role === 'student') {
        window.top.location.href = '/student/dashboard';
    } else if (user.role === 'faculty') {
        window.top.location.href = '/faculty/dashboard';
    }
}, 700);
}

const SMS_MESSAGE_TEMPLATES = {
    numberVerified: user => `Welcome to VEMU Library Notifications. Your phone number is verified successfully. Stay updated with issue confirmations, return reminders, overdue alerts, and fine notices.`,
    bookIssued: ({ bookTitle, dueDate }) => `Hello from VEMU Library. Your issued book has been recorded successfully. Kindly keep note of the due date${dueDate ? ` (${formatDate(dueDate)})` : ''} and return the book before the deadline to avoid fines.`,
    dueSoon: ({ bookTitle, dueDate }) => `VEMU Library Reminder: The return date for your borrowed book${bookTitle ? ` "${bookTitle}"` : ''} is approaching soon${dueDate ? ` on ${formatDate(dueDate)}` : ''}. Please return or renew it on time to avoid overdue fines.`,
    dueToday: ({ bookTitle }) => `Important: Today is the last date to return your library book${bookTitle ? ` "${bookTitle}"` : ''}. Kindly return it today to avoid penalty from VEMU Library.`,
    overdue: ({ bookTitle, amount }) => `Attention: You have missed the return date for your library book${bookTitle ? ` "${bookTitle}"` : ''}. Kindly return it as soon as possible. ${Number(amount || 0) > 0 ? `Current fine is ₹${Number(amount).toFixed(2)}. ` : ''}Fine charges may continue until submission.`,
    fineAdded: ({ amount }) => `VEMU Library Fine Alert: A fine has been added to your account${Number(amount || 0) > 0 ? ` for ₹${Number(amount).toFixed(2)}` : ''} due to late return of the borrowed book. Please check your dashboard for the fine amount and payment details.`,
    finalWarning: ({ bookTitle, amount }) => `Final Reminder from VEMU Library: Your borrowed book${bookTitle ? ` "${bookTitle}"` : ''} is still overdue. Return it immediately${Number(amount || 0) > 0 ? ` and clear the pending fine of ₹${Number(amount).toFixed(2)}` : ' and clear the pending fine'} to avoid further action on your account.`,
    finePaid: () => `Payment Confirmed: Your pending library fine has been cleared successfully. Your account has been updated in the VEMU Library system.`,
    returnConfirmed: ({ bookTitle }) => `VEMU Library: Your borrowed book${bookTitle ? ` "${bookTitle}"` : ''} has been returned successfully. Thank you for returning it on time. We hope to serve you again.`,
    renewalApproved: ({ bookTitle, dueDate }) => `Good News from VEMU Library: Your borrowed book${bookTitle ? ` "${bookTitle}"` : ''} has been renewed successfully. Kindly note the updated due date${dueDate ? ` ${formatDate(dueDate)}` : ''} and return it on time.`
};


function getServerApiBase() {
    const fromStorage = localStorage.getItem(STORAGE_KEYS.smsApiBase);
    const fromWindow = window.VEMU_SMS_API_BASE || window.VEMU_SERVER_API_BASE;
    const value = String(fromStorage || fromWindow || '').trim();
    return value ? value.replace(/\/+$/, '') : '';
}

function getPortableLibraryState() {
    return {
        users: getUsers(),
        books: getBooks(),
        transactions: getTransactions(),
        studentData: getStudentData(),
        notifications: getNotifications(),
        receipts: getReceipts(),
        renewalRequests: getRenewalRequests(),
        feedbackEntries: getFeedbackEntries(),
        bookSuggestions: normalizeLegacySuggestions()
    };
}

async function callServerJson(path, payload = null, method = 'POST') {
    const base = getServerApiBase();
    if (!base) {
        return { ok: false, message: 'Backend not configured. Frontend fallback mode is active.' };
    }
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (payload !== null) options.body = JSON.stringify(payload);
    let response;
    try {
        response = await fetch(`${base}${path}`, options);
    } catch (error) {
        return { ok: false, message: 'Server not reachable. Start the Node backend from the server folder.', error };
    }
    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }
    return { ok: response.ok && data.ok !== false, status: response.status, ...data };
}




function applyServerStateToLocal(state = {}) {
    if (Array.isArray(state.users)) localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
    if (Array.isArray(state.books)) localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(state.books));
    if (Array.isArray(state.transactions)) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
    if (state.studentData) localStorage.setItem(STORAGE_KEYS.studentData, JSON.stringify(state.studentData));
    if (Array.isArray(state.notifications)) localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(state.notifications));
    if (Array.isArray(state.receipts)) localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify(state.receipts));
    if (Array.isArray(state.renewalRequests)) localStorage.setItem(STORAGE_KEYS.renewalRequests, JSON.stringify(state.renewalRequests));
    if (Array.isArray(state.feedbackEntries)) localStorage.setItem(STORAGE_KEYS.feedbackEntries, JSON.stringify(state.feedbackEntries));
    if (Array.isArray(state.bookSuggestions)) localStorage.setItem(STORAGE_KEYS.bookSuggestions, JSON.stringify(state.bookSuggestions));
    seedManagedUsers();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (getServerApiBase()) {
    await bootstrapServerBackedState();
  }
});

async function bootstrapServerBackedState() {
    const remote = await callServerJson('/api/library-state', null, 'GET');
    if (!remote.ok || !remote.state) {
        scheduleServerStateSync(300);
        return remote;
    }

    const remoteState = remote.state || {};
    const keys = [
        'users',
        'books',
        'transactions',
        'studentData',
        'renewalRequests',
        'feedbackEntries',
        'bookSuggestions',
        'notifications',
        'receipts'
    ];

    const remoteHasData = keys.some(key => {
        if (key === 'studentData') return !!remoteState.studentData;
        return Array.isArray(remoteState[key]) && remoteState[key].length;
    });

    const localState = getPortableLibraryState();
    const localHasData = keys.some(key => {
        if (key === 'studentData') return !!localState.studentData;
        return Array.isArray(localState[key]) && localState[key].length;
    });

    if (remoteHasData) applyServerStateToLocal(remoteState);
    else if (localHasData) await syncPortableLibraryState();

    return remote;
}

function getSmsApiBase() {
    return getServerApiBase();
}

function normalizePhoneNumber(value = '') {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
    if (String(value).trim().startsWith('+')) return `+${digits}`;
    return digits.length >= 10 ? `+${digits}` : digits;
}

function isValidIndianMobile(value = '') {
    const digits = String(value || '').replace(/\D/g, '');
    return /^(91)?[6-9]\d{9}$/.test(digits);
}

async function callSmsApi(path, payload = {}) {
    const base = getSmsApiBase();
    if (!base) {
        return {
            ok: false,
            message: 'Backend not configured. Start the Node server only when you need cloud sync, SMS, or API features.'
        };
    }
    let response;
    try {
        response = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        return {
            ok: false,
            message: 'SMS server not reachable. Start the Node server from the server folder and check the API URL.',
            error
        };
    }
    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }
    return {
        ok: response.ok && data.ok !== false,
        ...data,
        status: response.status,
        message: data.message || (response.ok ? 'Success' : 'SMS request failed')
    };
}

function getPhoneVerificationStatus(user = {}) {
    const profile = user.profileDetails || {};
    return {
        phone: String(profile.phone || user.phone || '').trim(),
        verified: Boolean(profile.phoneVerified || user.phoneVerified),
        verifiedAt: profile.phoneVerifiedAt || user.phoneVerifiedAt || ''
    };
}

function saveUserPhoneNumber(uid, phone) {
    const users = getUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index === -1) return { ok: false, message: 'User not found' };
    const normalizedPhone = String(phone || '').trim();
    users[index] = {
        ...users[index],
        phone: normalizedPhone,
        phoneVerified: false,
        phoneVerifiedAt: '',
        profileDetails: {
            ...buildDefaultProfile(users[index]),
            ...(users[index].profileDetails || {}),
            phone: normalizedPhone,
            phoneVerified: false,
            phoneVerifiedAt: ''
        }
    };
    saveUsers(users);
    refreshCurrentUserFromStore(uid);
    return { ok: true, user: users[index], message: 'Phone number saved. Send OTP to verify.' };
}

async function sendOtpForUser(uid, phone) {
    if (!isValidIndianMobile(phone)) return { ok: false, message: 'Enter a valid Indian mobile number' };
    const user = getUserByUid(uid);
    if (!user) return { ok: false, message: 'User not found' };
    const saveResult = saveUserPhoneNumber(uid, phone);
    if (!saveResult.ok) return saveResult;
    return callSmsApi('/api/send-otp', {
        uid: user.uid,
        name: user.name || user.username || 'Library User',
        role: user.role,
        phone: normalizePhoneNumber(phone)
    });
}

async function verifyOtpForUser(uid, otpCode) {
    const user = getUserByUid(uid);
    if (!user) return { ok: false, message: 'User not found' };
    const phoneInfo = getPhoneVerificationStatus(user);
    if (!phoneInfo.phone) return { ok: false, message: 'Save phone number before OTP verification' };
    const result = await callSmsApi('/api/verify-otp', {
        uid: user.uid,
        phone: normalizePhoneNumber(phoneInfo.phone),
        otp: String(otpCode || '').trim()
    });
    if (!result.ok) return result;
    const users = getUsers();
    const index = users.findIndex(item => item.uid === uid);
    if (index === -1) return { ok: false, message: 'User not found after verification' };
    const verifiedAt = new Date().toISOString();
    users[index] = {
        ...users[index],
        phone: phoneInfo.phone,
        phoneVerified: true,
        phoneVerifiedAt: verifiedAt,
        profileDetails: {
            ...buildDefaultProfile(users[index]),
            ...(users[index].profileDetails || {}),
            phone: phoneInfo.phone,
            phoneVerified: true,
            phoneVerifiedAt: verifiedAt
        }
    };
    saveUsers(users);
    refreshCurrentUserFromStore(uid);
    await sendSmsAlertToUser(uid, 'numberVerified');
    return { ok: true, message: result.message || 'OTP verified successfully' };
}

async function sendSmsAlertToUser(uid, eventType, context = {}) {
    const user = getUserByUid(uid);
    if (!user) return { ok: false, skipped: true, message: 'User not found' };
    const phoneInfo = getPhoneVerificationStatus(user);
    if (!phoneInfo.phone || !phoneInfo.verified) {
        return { ok: false, skipped: true, message: 'Verified mobile number not available for this user' };
    }
    const template = SMS_MESSAGE_TEMPLATES[eventType];
    const message = typeof template === 'function' ? template({ ...context, user }) : String(context.message || '');
    if (!message) return { ok: false, skipped: true, message: 'SMS template missing' };
    return callSmsApi('/api/send-alert', {
        uid: user.uid,
        name: user.name || user.username || 'Library User',
        role: user.role,
        phone: normalizePhoneNumber(phoneInfo.phone),
        eventType,
        context,
        message
    });
}

async function syncLibraryServerState() {
    try {
        return await callSmsApi('/api/sync-library-state', {
            users: getUsers().map(user => {
                const phoneInfo = getPhoneVerificationStatus(user);
                return {
                    uid: user.uid,
                    name: user.name || '',
                    username: user.username || '',
                    role: user.role || '',
                    accountId: user.accountId || '',
                    phone: normalizePhoneNumber(phoneInfo.phone),
                    phoneVerified: phoneInfo.verified
                };
            }),
            transactions: getTransactions().filter(tx => tx.status === 'ISSUED').map(tx => ({
                txId: tx.txId,
                borrowerUid: tx.borrowerUid || '',
                borrowerName: tx.borrowerName || '',
                borrowerRole: tx.borrowerRole || '',
                bookId: tx.bookId,
                bookTitle: tx.bookTitle,
                issueDate: tx.issueDate,
                dueDate: tx.dueDate,
                fine: Number(tx.fine || 0),
                status: tx.status
            }))
        });
    } catch (error) {
        return { ok: false, message: 'Unable to sync reminder data' };
    }
}

async function queueReminderSweep() {
    try {
        return await callSmsApi('/api/run-reminder-sweep', {});
    } catch (error) {
        return { ok: false, message: 'Reminder sweep failed' };
    }
}

function checkAuth(requiredRole) {
    const user = getCurrentUser();
    const isAuthorized = Array.isArray(requiredRole) ? requiredRole.includes(user?.role) : user?.role === requiredRole;
if (!user || (requiredRole && !isAuthorized)) {
    window.location.href = '/login';
    return;
}

    const display = document.getElementById('user-display-name');
    if (display) display.textContent = user.name;
    const subtitle = document.getElementById('student-meta');
    if (subtitle && user.role === 'student') {
        const dept = user.dept || 'B.Tech CSE';
        const year = user.year || 'III Year';
        const roll = user.roll || '23-CSE-001';
        subtitle.textContent = `${dept} - ${year} (Roll: ${roll})`;
    }

    const logos = document.querySelectorAll('.sidebar-logo, .nav-logo img, .inst-logo');
    logos.forEach(img => {
        img.onerror = function() {
            this.style.display = 'none';
            if (this.parentElement && (this.parentElement.classList.contains('sidebar-header') || this.parentElement.id === 'logo-container' || this.parentElement.classList.contains('nav-logo'))) {
                const fallback = document.createElement('div');
                fallback.className = 'custom-fallback-logo';
                fallback.innerHTML = `<ion-icon name="library" style="color: #D35400; font-size: 2rem; vertical-align: middle;"></ion-icon> <span style="font-weight:700; color: #2C3E50;">VEMU</span>`;
                this.parentElement.prepend(fallback);
            }
        };
    });
}

function canUseLibraryOperations() {
    const currentUser = getCurrentUser();
    return currentUser && ['admin', 'librarian'].includes(currentUser.role);
}

function getSidebarBrandText() {
    const role = getDashboardRoleVariant();
    if (role === 'librarian') return 'VEMU Librarian';
    if (role === 'admin') return 'VEMU Admin';
    if (role === 'student') return 'VEMU Student';
    if (role === 'faculty') return 'VEMU Faculty';
    return 'VEMU Library';
}

function ensureSidebarBranding() {
    document.querySelectorAll('.sidebar-header').forEach(header => {
        let lockup = header.querySelector('.sidebar-brand-lockup');
        const logo = header.querySelector('.sidebar-logo, .custom-fallback-logo');
        if (!lockup) {
            lockup = document.createElement('div');
            lockup.className = 'sidebar-brand-lockup';
            if (logo) {
                logo.parentNode.insertBefore(lockup, logo);
                lockup.appendChild(logo);
            } else {
                header.prepend(lockup);
            }
        }
        let text = lockup.querySelector('.sidebar-brand-text');
        if (!text) {
            text = document.createElement('div');
            text.className = 'sidebar-brand-text';
            lockup.appendChild(text);
        }
        text.innerHTML = `<span class="brand-primary">VEMU</span><span class="brand-secondary">${getSidebarBrandText().replace(/^VEMU\s*/, '')}</span>`;
    });
}

function initAssets() {
    const logos = document.querySelectorAll('.sidebar-logo, .nav-logo img, .inst-logo, .footer-logo');
    logos.forEach(img => {
        img.onerror = function() {
            this.style.display = 'none';
            const container = this.parentElement;
            if (container && !container.querySelector('.custom-fallback-logo')) {
                const fallback = document.createElement('div');
                fallback.className = 'custom-fallback-logo';
                fallback.innerHTML = `<ion-icon name="library" style="color: #D35400; font-size: 2.2rem; vertical-align: middle;"></ion-icon><span style="font-weight:800; color: #1f2f46; font-size: 1.15rem; letter-spacing:0.02em;">VEMU <span style="color:#D35400">LT</span></span>`;
                container.prepend(fallback);
            }
        };
        if (img.complete && img.naturalHeight === 0) img.onerror();
    });
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
}

function initCounters() {
    const stats = document.querySelectorAll('.stat-box h2');
    stats.forEach(stat => {
        const target = parseInt(stat.innerText.replace(/,/g, '').replace('+', ''));
        let count = 0;
        const increment = target / 100 || 1;
        const updateCount = () => {
            if (count < target) {
                count += increment;
                stat.innerText = Math.ceil(count).toLocaleString() + (stat.innerText.includes('+') ? '+' : '');
                setTimeout(updateCount, 10);
            } else {
                stat.innerText = target.toLocaleString() + (stat.innerText.includes('+') ? '+' : '');
            }
        };
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                updateCount();
                observer.disconnect();
            }
        });
        observer.observe(stat);
    });
}

function logout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.location.href = '/login';
}

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: ${type === 'success' ? '#27AE60' : '#E74C3C'}; color: white; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999; animation: slideIn 0.5s forwards; max-width: 360px;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

const style = document.createElement('style');
style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0.2; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(style);

function searchBooks(query) {
    const books = getBooks();
    const q = (query || '').toLowerCase().trim();
    if (!q) return books;
    return books.filter(book => (book.title || '').toLowerCase().includes(q) || (book.author || '').toLowerCase().includes(q) || (book.category || '').toLowerCase().includes(q) || (book.isbn || '').toLowerCase().includes(q) || (book.id || '').toLowerCase().includes(q));
}

function addBookRecord(bookPayload) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can add books' };
    if (!bookPayload.title?.trim()) return { ok: false, message: 'Book title is required' };
    const books = getBooks();
    const generatedId = bookPayload.id?.trim() || `V-${String(Date.now()).slice(-6)}`;
    const exists = books.some(b => b.id.toLowerCase() === generatedId.toLowerCase());
    if (exists) return { ok: false, message: 'Book ID already exists' };
    const qty = Math.max(1, Number(bookPayload.qty || 1));
    const available = Math.min(qty, Math.max(0, Number(bookPayload.available ?? qty)));
    const newBook = ensureBookEnhancements({
        id: generatedId,
        title: bookPayload.title.trim(),
        author: (bookPayload.author || '').trim(),
        category: (bookPayload.category || '').trim(),
        isbn: (bookPayload.isbn || '').trim(),
        qty,
        available,
        publisher: (bookPayload.publisher || '').trim(),
        barcodeNumber: bookPayload.barcodeNumber || '',
        digitalCopyPrice: Number(bookPayload.digitalCopyPrice || 50)
    });
    books.push(newBook);
    saveBooks(books);
    addNotification(`New book added: ${newBook.title}`, 'library');
    return { ok: true, book: newBook };
}

function updateBookRecord(bookId, updates) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Unauthorized action' };
    const books = getBooks();
    const index = books.findIndex(b => b.id === bookId);
    if (index === -1) return { ok: false, message: 'Book not found' };
    const qty = Math.max(1, Number(updates.qty ?? books[index].qty ?? 1));
    const available = Math.min(qty, Math.max(0, Number(updates.available ?? books[index].available ?? qty)));
    books[index] = ensureBookEnhancements({
        ...books[index],
        ...updates,
        qty,
        available,
        title: String(updates.title ?? books[index].title).trim(),
        author: String(updates.author ?? books[index].author).trim(),
        category: String(updates.category ?? books[index].category).trim(),
        isbn: String(updates.isbn ?? books[index].isbn).trim(),
        publisher: String(updates.publisher ?? books[index].publisher ?? '').trim(),
        barcodeNumber: updates.barcodeNumber ?? books[index].barcodeNumber,
        digitalCopyPrice: Number(updates.digitalCopyPrice ?? books[index].digitalCopyPrice ?? 50)
    });
    saveBooks(books);
    return { ok: true, book: books[index] };
}

function deleteBookRecord(bookId) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Unauthorized action' };
    const books = getBooks();
    const existing = books.find(b => b.id === bookId);
    if (!existing) return { ok: false, message: 'Book not found' };
    saveBooks(books.filter(b => b.id !== bookId));
    addNotification(`Book removed: ${existing.title}`, 'library');
    return { ok: true };
}

function calculateDueDate(days) {
    const now = new Date();
    now.setDate(now.getDate() + Number(days || 15));
    return now.toISOString().split('T')[0];
}

function issueBookToUser(bookId, borrowerId = '', durationDays = 15) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can issue books' };
    const books = getBooks();
    const users = getUsers();
    const book = books.find(b => b.id === (findBookByScan(bookId)?.id || bookId));
    if (!book) return { ok: false, message: 'Book not found' };
    if (book.available <= 0) return { ok: false, message: 'Book currently unavailable' };
    const borrower = users.find(u => u.accountId === borrowerId || u.username === borrowerId || u.id === borrowerId);
    if (!borrower || !['student', 'faculty'].includes(borrower.role)) return { ok: false, message: 'Student or faculty account not found' };
    const transactions = getTransactions();


    // const dueDays = borrower.role === 'faculty' ? Math.max(Number(durationDays || 90), 30) : Math.max(Number(durationDays || 15), 1);

const dueDays = Math.max(1, Number(durationDays || 1));

    const tx = {
    txId: createId('TX'),
    bookId: book.id,
    barcodeNumber: book.barcodeNumber,
    bookTitle: book.title,
    bookAuthor: book.author || '-',   // ✅ ADD THIS
    borrowerId: borrower.accountId || borrower.username,
    borrowerName: borrower.name,
    borrowerRole: borrower.role,
    issueDate: todayISO(),
    dueDate: calculateDueDate(dueDays),
    returnedAt: '',
    fine: 0,
    status: 'ISSUED'
};

    book.available -= 1;
    saveBooks(books);
    transactions.unshift(tx);
    saveTransactions(transactions);
    addNotification(`Book issued: ${book.title} to ${borrower.name}`, 'library');
    sendSmsAlertToUser(borrower.uid, 'bookIssued', { bookTitle: book.title, dueDate: tx.dueDate }).catch(() => {});
    syncLibraryServerState().then(() => queueReminderSweep()).catch(() => {});
    return { ok: true, message: `Issued ${book.title}`, transaction: tx };
}

function returnBookById(bookId, options = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser || !['admin', 'librarian'].includes(currentUser.role)) return { ok: false, message: 'Only admin or librarian can process returns' };
    const preview = previewReturnById(bookId, options);
    if (!preview.ok) return preview;
    const { tx, borrower, overdueFine, damageFine, totalFine } = preview;

    const transactions = getTransactions();
    const activeIndex = transactions.findIndex(item => item.txId === tx.txId);
    if (activeIndex === -1) return { ok: false, message: 'Transaction no longer available' };

    const books = getBooks();
    const book = books.find(b => b.id === tx.bookId);
    if (book) {
        book.available = Math.min(book.qty, Number(book.available || 0) + 1);
        saveBooks(books);
    }

    transactions[activeIndex] = {
        ...tx,
        returnedAt: new Date().toISOString(),
        fine: totalFine,
        overdueFine,
        damageFine,
        damageIssue: Boolean(options.isDamaged),
        damageNote: String(options.damageNote || '').trim(),
        status: 'RETURNED'
    };
    saveTransactions(transactions);

    let receipt = null;
    if (totalFine > 0) {
        const users = getUsers();
        const borrowerIndex = users.findIndex(user =>
            user.uid === (borrower?.uid || tx.borrowerUid || '') ||
            (user.accountId || '') === (borrower?.accountId || tx.borrowerAccountId || tx.borrowerId || '') ||
            (user.username || '') === (borrower?.username || tx.borrowerUsername || '')
        );
        if (borrowerIndex !== -1) {
            users[borrowerIndex].fineAmount = Number(users[borrowerIndex].fineAmount || 0) + totalFine;
            users[borrowerIndex].lastFineAddedAt = new Date().toISOString();
            saveUsers(users);
            refreshCurrentUserFromStore(users[borrowerIndex].uid);
        }

        receipt = {
            receiptId: createId('RCP'),
            txType: 'RETURN_FINE',
            userUid: borrower?.uid || tx.borrowerUid || '',
            accountId: borrower?.accountId || tx.borrowerAccountId || tx.borrowerId || '',
            username: borrower?.username || tx.borrowerUsername || '',
            name: borrower?.name || tx.borrowerName || '',
            role: borrower?.role || tx.borrowerRole || '',
            amount: totalFine,
            upiId: 'omkarvinayaka@okaxis',
            transactionId: '',
            paidAt: new Date().toISOString(),
            note: `Return fine added to account for ${tx.bookTitle}${damageFine > 0 ? ' with damage issue' : ''}`,
            verificationStatus: 'ADDED_TO_ACCOUNT',
            verifiedBy: currentUser.name || currentUser.username || currentUser.role,
            verifiedAt: new Date().toISOString(),
            bookId: tx.bookId,
            bookTitle: tx.bookTitle,
            barcodeNumber: tx.barcodeNumber,
            processedBy: currentUser.name || currentUser.username || currentUser.role,
            overdueFine,
            damageFine
        };
        const receipts = getReceipts();
        receipts.unshift(receipt);
        saveReceipts(receipts);
        addNotification(`Return fine added to ${receipt.name}'s account for ${tx.bookTitle} - ₹${totalFine.toFixed(2)}`, 'library');
    }

    const parts = [];
    if (overdueFine > 0) parts.push(`overdue ₹${overdueFine.toFixed(2)}`);
    if (damageFine > 0) parts.push(`damage ₹${damageFine.toFixed(2)}`);
    const message = totalFine > 0
        ? `Return processed successfully. ₹${totalFine.toFixed(2)} was added to the user's fine account${parts.length ? ` (${parts.join(' + ')})` : ''}`
        : 'Return processed successfully';

    addNotification(`Book returned: ${tx.bookTitle}${totalFine > 0 ? ` | Fine added ₹${totalFine.toFixed(2)}` : ''}`, 'library');
    if (borrower?.uid) {
        sendSmsAlertToUser(borrower.uid, 'returnConfirmed', { bookTitle: tx.bookTitle }).catch(() => {});
        if (totalFine > 0) sendSmsAlertToUser(borrower.uid, 'fineAdded', { bookTitle: tx.bookTitle, amount: totalFine }).catch(() => {});
    }
    syncLibraryServerState().then(() => queueReminderSweep()).catch(() => {});
    return { ok: true, transaction: transactions[activeIndex], totalFine, overdueFine, damageFine, receipt, message };
}

function requestIssue(bookId) {
    const currentUser = getCurrentUser();

    if (!currentUser || !['student', 'faculty'].includes(currentUser.role)) {
        showToast('Only student or faculty can request books', 'error');
        return { ok: false, message: 'Only student or faculty can request books' };
    }

    const user = getUserByUid(currentUser.uid) || currentUser;
    const books = getBooks();
    const transactions = getTransactions();

    const book = books.find(b => b.id === (findBookByScan(bookId)?.id || bookId));

    if (!book) {
        showToast('Book not found', 'error');
        return { ok: false, message: 'Book not found' };
    }

    if (Number(book.available || 0) <= 0) {
        showToast('Book currently unavailable', 'error');
        return { ok: false, message: 'Book currently unavailable' };
    }

    const alreadyPending = transactions.find(tx =>
        tx.status === 'PENDING' &&
        tx.bookId === book.id &&
        (
            tx.borrowerUid === user.uid ||
            tx.borrowerAccountId === user.accountId ||
            tx.borrowerUsername === user.username
        )
    );

    if (alreadyPending) {
        showToast(`Issue request already pending for ${book.title}`, 'error');
        return { ok: false, message: `Issue request already pending for ${book.title}` };
    }

    const alreadyIssued = transactions.find(tx =>
        tx.status === 'ISSUED' &&
        tx.bookId === book.id &&
        (
            tx.borrowerUid === user.uid ||
            tx.borrowerAccountId === user.accountId ||
            tx.borrowerUsername === user.username
        )
    );

    if (alreadyIssued) {
        showToast(`You already have ${book.title}`, 'error');
        return { ok: false, message: `You already have ${book.title}` };
    }

    const requestTx = {
        txId: createId('REQ'),
        bookId: book.id,
        barcodeNumber: book.barcodeNumber || '',
        bookTitle: book.title,
        bookAuthor: book.author || '-',
        borrowerId: user.accountId || user.username || user.id || '',
        borrowerUid: user.uid || '',
        borrowerAccountId: user.accountId || '',
        borrowerUsername: user.username || '',
        borrowerName: user.name || user.username || '',
        borrowerRole: user.role || '',
        issueDate: '',
        dueDate: '',
        requestedAt: new Date().toISOString(),
        returnedAt: '',
        fine: 0,
        status: 'PENDING'
    };

    transactions.unshift(requestTx);
    saveTransactions(transactions);

    addNotification(
        `New issue request: ${book.title} requested by ${user.name || user.username} (${user.role})`,
        'library'
    );

    addNotification(
        `Your issue request was sent for ${book.title}`,
        user.uid
    );

    showToast(`Issue request sent for ${book.title}`, 'success');

    return { ok: true, request: requestTx, message: `Issue request sent for ${book.title}` };
}

function requestRenewal(title, extra = {}) {
    const result = requestRenewalForCurrentUser(title, extra);
    if (!result.ok) {
        showToast(result.message, 'error');
        return result;
    }
    showToast(result.message, 'success');
    return result;
}

function payFine() {
    const result = markFinePaidForCurrentUser();
    if (!result.ok) {
        showToast(result.message, 'error');
        return;
    }
    showToast(result.message, 'success');
    setTimeout(() => window.location.reload(), 500);
}


function purchaseDigitalCopy(bookScanValue, amount = 50) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { ok: false, message: 'Login required for digital copy access' };
    const book = findBookByScan(bookScanValue);
    if (!book) return { ok: false, message: 'Book not found for digital copy' };
    const payAmount = Math.max(0, Number(amount || book.digitalCopyPrice || 50));
    const receipt = {
        receiptId: createId('RCP'),
        txType: 'DIGITAL_COPY',
        userUid: currentUser.uid,
        accountId: currentUser.accountId || '',
        username: currentUser.username || '',
        name: currentUser.name || '',
        role: currentUser.role || '',
        amount: payAmount,
        upiId: 'omkarvinayaka@okaxis',
        paidAt: new Date().toISOString(),
        note: `Digital PDF copy purchased for ${book.title}`,
        bookId: book.id,
        bookTitle: book.title,
        barcodeNumber: book.barcodeNumber
    };
    const receipts = getReceipts();
    receipts.unshift(receipt);
    saveReceipts(receipts);
    addNotification(`Digital copy purchased for ${book.title} by ${currentUser.name}`, 'library');
    const pdfBlob = createSimplePdfBlob(`${book.title} - Digital Copy`, [
        `Author: ${book.author || '-'}`,
        `Book ID: ${book.id}`,
        `Barcode No: ${book.barcodeNumber}`,
        `Department: ${book.category || '-'}`,
        `Purchased By: ${currentUser.name} (${currentUser.role})`,
        `Paid Amount: ₹${payAmount.toFixed(2)}`,
        `UPI ID: omkarvinayaka@okaxis`,
        `Downloaded At: ${formatDate(new Date())}`,
        'Demo library PDF access copy.'
    ]);
    triggerFileDownload(`${String(book.title || 'book').replace(/[^a-z0-9]+/gi, '_')}_digital_copy.pdf`, pdfBlob);
    return { ok: true, receipt, book, message: `Digital copy ready for ${book.title}` };
}

function buildLibraryBackupPayload() {
    return {
        exportedAt: new Date().toISOString(),
        users: getUsers(),
        books: getBooks(),
        transactions: getTransactions(),
        studentData: getStudentData(),
        notifications: getNotifications(),
        receipts: getReceipts()
    };
}

function exportLibraryBackup() {
    downloadTextFile('vemu-library-backup.json', JSON.stringify(buildLibraryBackupPayload(), null, 2));
    showToast('Backup downloaded successfully', 'success');
}

function importLibraryBackupFile(file) {
    if (!file) {
        showToast('Select a backup file', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const parsed = parseSafeJSON(evt.target.result, null);
        if (!parsed) {
            showToast('Invalid backup file', 'error');
            return;
        }
        if (Array.isArray(parsed.users)) saveUsers(parsed.users);
        if (Array.isArray(parsed.books)) saveBooks(parsed.books);
        if (Array.isArray(parsed.transactions)) saveTransactions(parsed.transactions);
        if (parsed.studentData) saveStudentData(parsed.studentData);
        if (Array.isArray(parsed.notifications)) saveNotifications(parsed.notifications);
        if (Array.isArray(parsed.receipts)) saveReceipts(parsed.receipts);
        showToast('Backup imported successfully', 'success');
        setTimeout(() => window.location.reload(), 600);
    };
    reader.readAsText(file);
}


function getThemeStorageKey() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.uid ? `${STORAGE_KEYS.theme}_${currentUser.uid}` : STORAGE_KEYS.theme;
}

function getStoredTheme() {
    const userThemeKey = getThemeStorageKey();
    return localStorage.getItem(userThemeKey) || localStorage.getItem(STORAGE_KEYS.theme) || 'light';
}

function updateThemeToggleVisuals(theme = 'light') {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle-label]').forEach(label => {
        label.textContent = normalized === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
    document.querySelectorAll('[data-theme-toggle-icon]').forEach(icon => {
        icon.setAttribute('name', normalized === 'dark' ? 'sunny-outline' : 'moon-outline');
    });
}

function applyTheme(theme = 'light') {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    localStorage.setItem(getThemeStorageKey(), normalized);
    updateThemeToggleVisuals(normalized);
}

function toggleTheme() {
    applyTheme(getStoredTheme() === 'dark' ? 'light' : 'dark');
}

function mountThemeToggle() {
    applyTheme(getStoredTheme());
    const nav = document.querySelector('.dashboard-nav');
    if (!nav || document.getElementById('theme-toggle-btn') || document.body.classList.contains('no-auto-dashboard-tools')) return;

    let host = nav.querySelector('.theme-toggle-host');
    if (!host) {
        host = document.createElement('div');
        host.className = 'theme-toggle-host';
        nav.appendChild(host);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'theme-toggle-btn';
    btn.className = 'btn btn-outline theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML = `<ion-icon data-theme-toggle-icon name="${getStoredTheme() === 'dark' ? 'sunny-outline' : 'moon-outline'}"></ion-icon><span data-theme-toggle-label>${getStoredTheme() === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>`;
    btn.addEventListener('click', toggleTheme);
    host.appendChild(btn);
    updateThemeToggleVisuals(getStoredTheme());
}



function getDashboardRoleVariant() {
    const current = getCurrentUser() || {};
    const path = window.location.pathname.toLowerCase();
    if (current.role) return current.role;
    if (path.includes('/admin/')) return 'admin';
    if (path.includes('/librarian/')) return 'librarian';
    if (path.includes('/faculty/')) return 'faculty';
    if (path.includes('/student/')) return 'student';
    return 'admin';
}

function getGreetingByHour(hour) {
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function getDashboardGreetingAccent(role = 'admin') {
    const accents = {
        admin: 'System Overview',
        librarian: 'Library Operations',
        faculty: 'Academic Workspace',
        student: 'Learning Hub'
    };
    return accents[role] || 'Dashboard Center';
}

function ensureSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const navLeft = document.querySelector('.dashboard-nav .nav-left');
    if (!sidebar || !navLeft || document.getElementById('sidebar-toggle-btn') || document.body.classList.contains('no-auto-dashboard-tools')) return;

    document.body.classList.add('has-sidebar-toggle');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sidebar-toggle-btn';
    btn.className = 'sidebar-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle sidebar');
    btn.innerHTML = '<ion-icon name="menu-outline"></ion-icon>';
    navLeft.prepend(btn);

    const applyState = collapsed => {
        if (window.innerWidth <= 768) {
            document.body.classList.toggle('sidebar-open', !collapsed);
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.toggle('sidebar-collapsed', collapsed);
            document.body.classList.remove('sidebar-open');
        }
    };

    const key = `vemu_sidebar_${getDashboardRoleVariant()}`;
    applyState(localStorage.getItem(key) === 'collapsed');

    btn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.body.classList.toggle('sidebar-open');
        } else {
            const collapsed = !document.body.classList.contains('sidebar-collapsed');
            document.body.classList.toggle('sidebar-collapsed', collapsed);
            localStorage.setItem(key, collapsed ? 'collapsed' : 'open');
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-open');
            document.body.classList.toggle('sidebar-collapsed', localStorage.getItem(key) === 'collapsed');
        }
    });

    document.addEventListener('click', event => {
        if (window.innerWidth > 768 || !document.body.classList.contains('sidebar-open')) return;
        if (sidebar.contains(event.target) || btn.contains(event.target)) return;
        document.body.classList.remove('sidebar-open');
    });
}

function mountDashboardGreetingCard() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main-content');
    if (!sidebar || !main || document.getElementById('dashboard-greeting-card')) return;

    const path = window.location.pathname.toLowerCase();
    if (!path.includes('dashboard')) return;
    const current = getCurrentUser() || {};
    const role = getDashboardRoleVariant();
    const displayName = (current.name || current.username || document.getElementById('user-display-name')?.textContent || role || 'User').trim();

    const wrap = document.createElement('section');
    wrap.className = 'dashboard-greeting-wrap animate-fade';
    wrap.innerHTML = `
        <div id="dashboard-greeting-card" class="dashboard-greeting-card greeting-variant-${role}">
            <div class="greeting-copy">
                <div class="greeting-chip"><ion-icon name="sparkles-outline"></ion-icon> ${getDashboardGreetingAccent(role)}</div>
                <h1 class="greeting-title"><span class="greeting-prefix"></span>, <span class="greeting-highlight">${displayName}</span>!</h1>
                <p class="greeting-subtitle">Here is your live library dashboard with quick updates, current time, and the latest activity.</p>
            </div>
            <div class="greeting-timebox">
                <span class="greeting-live-time" id="dashboard-live-time">--:--</span>
                <span class="greeting-live-date" id="dashboard-live-date">--</span>
                <span class="greeting-live-day" id="dashboard-live-day">--</span>
            </div>
        </div>
    `;
    main.prepend(wrap);

    const titleEl = wrap.querySelector('.greeting-prefix');
    const timeEl = wrap.querySelector('#dashboard-live-time');
    const dateEl = wrap.querySelector('#dashboard-live-date');
    const dayEl = wrap.querySelector('#dashboard-live-day');

    const updateGreetingClock = () => {
        const now = new Date();
        titleEl.textContent = getGreetingByHour(now.getHours());
        timeEl.textContent = now.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
        dateEl.textContent = now.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        dayEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long' });
    };

    updateGreetingClock();
    window.setInterval(updateGreetingClock, 1000);
}

function getLibraryReportData() {
    const users = getUsers();
    const books = getBooks();
    const transactions = getTransactions();
    const active = transactions.filter(t => t.status === 'ISSUED');
    const returned = transactions.filter(t => t.status === 'RETURNED');
    const fines = getAllFineReceipts().reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const byCategory = books.reduce((acc, book) => {
        acc[book.category || 'Other'] = (acc[book.category || 'Other'] || 0) + 1;
        return acc;
    }, {});
    return {
        totalUsers: users.length,
        totalManagedUsers: users.filter(u => u.role !== 'admin').length,
        totalBooks: books.reduce((sum, book) => sum + Number(book.qty || 0), 0),
        totalTitles: books.length,
        activeIssues: active.length,
        returnedCount: returned.length,
        finesCollected: fines,
        byCategory
    };
}


function getLibraryPulseData() {
    const users = getUsers();
    const books = getBooks();
    const txs = getTransactions();
    const suggestions = normalizeLegacySuggestions();
    const feedback = getFeedbackEntries();
    const activeUsers = users.filter(user => ['student', 'faculty', 'librarian'].includes(String(user.role || '').toLowerCase()) && String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const activeIssues = txs.filter(tx => tx.status === 'ISSUED').length;
    const totalCopies = books.reduce((sum, book) => sum + Number(book.qty || 0), 0);
    const pendingRenewals = getRenewalRequests().filter(item => item.status === 'PENDING').length;
    const pendingSuggestions = suggestions.filter(item => item.status === 'PENDING').length;
    const pendingApprovals = pendingRenewals + pendingSuggestions;
    const loadBase = totalCopies ? (activeIssues / Math.max(1, totalCopies)) * 70 : 12;
    const loadPressure = Math.min(18, pendingApprovals * 3.5);
    const userPressure = Math.min(14, activeUsers * 1.1);
    const serverLoad = Math.max(8, Math.min(96, Math.round(loadBase + loadPressure + userPressure)));
    let healthLabel = 'OPTIMAL';
    if (serverLoad >= 75) healthLabel = 'HIGH';
    else if (serverLoad >= 55) healthLabel = 'BUSY';
    else if (serverLoad >= 35) healthLabel = 'STABLE';
    return { activeUsers, serverLoad, healthLabel, activeIssues, pendingApprovals, totalFeedback: feedback.length, totalSuggestions: suggestions.length, totalTitles: books.length };
}

function renderLibraryPulseNode() {
    const pulse = getLibraryPulseData();
    const loadEl = document.getElementById('live-server-load');
    const usersEl = document.getElementById('live-active-users');
    const metaEl = document.getElementById('live-node-meta');
    if (loadEl) {
        loadEl.textContent = `${pulse.serverLoad}% ${pulse.healthLabel}`;
        loadEl.style.color = pulse.serverLoad >= 75 ? '#ef4444' : (pulse.serverLoad >= 55 ? '#f59e0b' : '#27AE60');
    }
    if (usersEl) usersEl.textContent = `${pulse.activeUsers} ACTIVE`;
    if (metaEl) metaEl.textContent = `${pulse.activeIssues} live issues • ${pulse.pendingApprovals} pending approvals • ${pulse.totalTitles} titles`;
}

function getCurrentDashboardRole() {
    return String(getCurrentUser()?.role || '').toLowerCase();
}

function getAssistantRootPrefix() {
    const path = window.location.pathname.toLowerCase();
    return ['/admin/', '/student/', '/faculty/', '/librarian/'].some(part => path.includes(part)) ? '../' : '';
}

function getAssistantWelcome() {
    const role = getCurrentDashboardRole();
    if (role === 'student') return 'Hello. I am your VEMU Library assistant. I can help you renew books, search the catalog, and add book suggestions.';
    if (role === 'faculty') return 'Hello. I am your VEMU Library assistant. I can help you search books, renew titles, and submit new book suggestions.';
    if (role === 'admin' || role === 'librarian') return 'Hello. I am your VEMU Library assistant. I can help you review renewals, suggestions, and live library activity.';
    return 'Hello. I am your VEMU Library assistant. Ask me about books, suggestions, feedback, and portal actions.';
}

function assistantSpeak(text) {
    if (!('speechSynthesis' in window)) return;
    if (localStorage.getItem(STORAGE_KEYS.assistantVoice) === 'off') return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    } catch (error) {}
}

function appendAssistantMessage(host, text, who = 'assistant') {
    if (!host) return;
    const item = document.createElement('div');
    item.style.cssText = `display:flex; ${who === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'} margin-bottom:10px;`;
    const bubble = document.createElement('div');
    bubble.style.cssText = `${who === 'user' ? 'background:linear-gradient(135deg,#2c3e50,#3d5570); color:white; border-radius:18px 18px 4px 18px;' : 'background:#f8fafc; color:#1f2f46; border:1px solid #e2e8f0; border-radius:18px 18px 18px 4px;'} padding:12px 14px; max-width:86%; font-size:0.84rem; line-height:1.55; box-shadow:0 10px 30px rgba(15,23,42,0.08); white-space:pre-wrap;`;
    bubble.textContent = text;
    item.appendChild(bubble);
    host.appendChild(item);
    host.scrollTop = host.scrollHeight;
    if (who === 'assistant') assistantSpeak(text);
}

function searchCatalogForAssistant(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return getBooks().filter(book => [book.title, book.author, book.category, book.isbn, book.id].some(value => String(value || '').toLowerCase().includes(q))).slice(0, 5);
}

function getAssistantQuickSummary() {
    const user = getCurrentUser();
    const pulse = getLibraryPulseData();
    const role = getCurrentDashboardRole();
    if (!user) return `The library currently has ${pulse.totalTitles} titles, ${pulse.activeUsers} active users, and ${pulse.pendingApprovals} pending approvals.`;
    if (role === 'student' || role === 'faculty') {
        const history = getUserTransactionHistory(user.uid);
        const issued = history.filter(item => item.status === 'ISSUED').length;
        const renewals = getRenewalRequests().filter(item => item.userUid === user.uid && item.status === 'PENDING').length;
        const suggestions = getUserSuggestions(user.uid).length;
        return `You currently have ${issued} active borrowed books, ${renewals} pending renewal requests, and ${suggestions} book suggestions in your history.`;
    }
    const suggestions = normalizeLegacySuggestions().filter(item => item.status === 'PENDING').length;
    const renewals = getRenewalRequests().filter(item => item.status === 'PENDING').length;
    return `There are ${renewals} pending renewals, ${suggestions} pending book suggestions, and ${pulse.activeIssues} books in live circulation.`;
}

function buildSuggestionFromChat(text) {
    const cleaned = String(text || '').replace(/^.*?:/,'').trim();
    const byParts = cleaned.split(/\s+by\s+/i);
    const bookName = (byParts[0] || '').trim();
    let authorName = '';
    let edition = 'Latest Edition';
    if (byParts[1]) {
        const chunks = byParts[1].split(',').map(item => item.trim()).filter(Boolean);
        authorName = chunks[0] || '';
        edition = chunks[1] || edition;
    }
    if (!bookName) return null;
    return { bookName, authorName: authorName || 'Unknown Author', edition, reason: 'Requested through AI assistant' };
}

function handleAssistantCommand(inputText) {
    const text = String(inputText || '').trim();
    const lower = text.toLowerCase();
    const user = getCurrentUser();
    const role = getCurrentDashboardRole();
    if (!text) return 'Please type a request so I can help you.';
    if (/(hello|hi|hey)/.test(lower)) return `${getAssistantWelcome()}\n${getAssistantQuickSummary()}`;
    if (/(summary|status|overview|dashboard)/.test(lower)) return getAssistantQuickSummary();
    if (/feedback/.test(lower)) {
        const feedback = getFeedbackEntries();
        return `Home page feedback is connected to ${feedback.length || 3} entries right now. The feedback cards now render automatically on the home page.`;
    }
    if (/(search|find|catalog|book available)/.test(lower)) {
        const query = text.replace(/.*?(search|find|catalog)\s*/i, '').trim() || text;
        const results = searchCatalogForAssistant(query);
        if (!results.length) return `I could not find a matching book for ${query}.`;
        return 'Top catalog matches:\n' + results.map(book => `• ${book.title} by ${book.author} — ${Number(book.available || 0)} available`).join('\n');
    }
    if (/renew/.test(lower) && user && ['student','faculty'].includes(role)) {
        const books = getUserTransactionHistory(user.uid).filter(item => item.status === 'ISSUED');
        const target = books.find(item => lower.includes(String(item.bookTitle || '').toLowerCase())) || books[0];
        if (!target) return 'You do not have an active issued book to renew right now.';
        const result = requestRenewalForCurrentUser(target.bookTitle, { bookId: target.bookId || '', dueDate: target.dueDate || '' });
        return result.message;
    }
    if ((/suggest|recommend|new book/.test(lower)) && user && ['student','faculty'].includes(role)) {
        const suggestion = buildSuggestionFromChat(text);
        if (!suggestion) return 'To add a suggestion through chat, type for example: Suggest book: Clean Code by Robert C. Martin, 2nd Edition';
        const result = submitBookSuggestion(suggestion);
        return result.message + ` Saved title: ${suggestion.bookName}.`;
    }
    if ((role === 'admin' || role === 'librarian') && /pending suggestion|suggestion list/.test(lower)) {
        const items = normalizeLegacySuggestions().filter(item => item.status === 'PENDING').slice(0,5);
        if (!items.length) return 'There are no pending book suggestions right now.';
        return 'Pending suggestions:\n' + items.map(item => `• ${item.bookName} — ${item.suggesterName} (${item.suggesterRole})`).join('\n');
    }
    if ((role === 'admin' || role === 'librarian') && /pending renewal|renewal list/.test(lower)) {
        const items = getRenewalRequests().filter(item => item.status === 'PENDING').slice(0,5);
        if (!items.length) return 'There are no pending renewal requests right now.';
        return 'Pending renewals:\n' + items.map(item => `• ${item.bookTitle} — ${item.requesterName}`).join('\n');
    }
    if (/open suggestion/.test(lower)) {
        if (role === 'student') { window.location.href = `${getAssistantRootPrefix()}student/book-suggestions.html`; return 'Opening your student suggestions page.'; }
        if (role === 'faculty') { window.location.href = `${getAssistantRootPrefix()}faculty/book-suggestions.html`; return 'Opening your faculty suggestions page.'; }
        if (role === 'admin') { window.location.href = `${getAssistantRootPrefix()}admin/suggestions.html`; return 'Opening the admin suggestions page.'; }
        if (role === 'librarian') { window.location.href = `${getAssistantRootPrefix()}librarian/suggestions.html`; return 'Opening the librarian suggestions page.'; }
    }
    if (/help|what can you do/.test(lower)) {
        return 'You can ask me to search a book, renew an issued title, suggest a new book, show a summary, open suggestions, or read pending renewals.';
    }
    return 'I understood your request, but this assistant works best with library actions like search, renew, suggest book, feedback, and dashboard summary.';
}

function mountLibraryAssistant_DISABLED() {
    if (document.getElementById('vemu-ai-launcher')) return;
    const root = document.createElement('div');
    root.innerHTML = `
        <button id="vemu-ai-launcher" type="button" aria-label="Open VEMU AI Assistant" style="position:fixed; right:22px; bottom:22px; width:64px; height:64px; border:none; border-radius:50%; background:linear-gradient(135deg,#d35400,#f59e0b); color:white; box-shadow:0 18px 44px rgba(211,84,0,0.35); z-index:5000; cursor:pointer; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; inset:5px; border-radius:50%; border:1px solid rgba(255,255,255,0.28);"></span>
            <ion-icon name="sparkles-outline" style="font-size:1.65rem;"></ion-icon>
        </button>
        <div id="vemu-ai-panel" style="position:fixed; right:22px; bottom:98px; width:min(380px, calc(100vw - 28px)); background:white; border:1px solid rgba(15,23,42,0.08); border-radius:24px; box-shadow:0 24px 80px rgba(15,23,42,0.22); overflow:hidden; z-index:5001; display:none;">
            <div style="padding:18px 18px 14px; background:linear-gradient(135deg,#1f2f46,#314863); color:white;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                    <div>
                        <div style="font-size:0.74rem; letter-spacing:0.08em; text-transform:uppercase; opacity:0.82;">VEMU Live AI Assistant</div>
                        <div style="font-size:1rem; font-weight:700; margin-top:6px;">Smart library support</div>
                    </div>
                    <button id="vemu-ai-close" type="button" style="width:38px; height:38px; border:none; border-radius:12px; background:rgba(255,255,255,0.12); color:white; cursor:pointer;"><ion-icon name="close-outline" style="font-size:1.2rem;"></ion-icon></button>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
                    <button type="button" data-ai-chip="summary" style="border:none; border-radius:999px; padding:7px 12px; font-size:0.73rem; cursor:pointer;">Summary</button>
                    <button type="button" data-ai-chip="search data structures" style="border:none; border-radius:999px; padding:7px 12px; font-size:0.73rem; cursor:pointer;">Search book</button>
                    <button type="button" data-ai-chip="renew book" style="border:none; border-radius:999px; padding:7px 12px; font-size:0.73rem; cursor:pointer;">Renew</button>
                    <button type="button" data-ai-chip="help" style="border:none; border-radius:999px; padding:7px 12px; font-size:0.73rem; cursor:pointer;">Help</button>
                </div>
            </div>
            <div id="vemu-ai-messages" style="height:320px; overflow:auto; padding:16px; background:linear-gradient(180deg,#fff,#f8fafc);"></div>
            <div style="padding:14px; border-top:1px solid #eef2f7; background:white;">
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <textarea id="vemu-ai-input" rows="2" placeholder="Ask about books, renewals, suggestions, feedback..." style="flex:1; resize:none; border:1px solid #dbe4ee; border-radius:16px; padding:12px; font:inherit; outline:none;"></textarea>
                    <button id="vemu-ai-voice" type="button" title="Voice assist" style="width:48px; height:48px; border:none; border-radius:16px; background:#fff7ed; color:#d35400; cursor:pointer;"><ion-icon name="mic-outline" style="font-size:1.15rem;"></ion-icon></button>
                    <button id="vemu-ai-send" type="button" style="width:48px; height:48px; border:none; border-radius:16px; background:linear-gradient(135deg,#d35400,#f59e0b); color:white; cursor:pointer;"><ion-icon name="send-outline" style="font-size:1.1rem;"></ion-icon></button>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.72rem; color:#64748b; gap:10px; flex-wrap:wrap;">
                    <span>Chat, voice assist, renew, suggest, and search.</span>
                    <button id="vemu-ai-voice-toggle" type="button" style="border:none; background:none; color:#d35400; cursor:pointer; padding:0;">Voice replies on</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(root);
    const launcher = document.getElementById('vemu-ai-launcher');
    const panel = document.getElementById('vemu-ai-panel');
    const closeBtn = document.getElementById('vemu-ai-close');
    const sendBtn = document.getElementById('vemu-ai-send');
    const voiceBtn = document.getElementById('vemu-ai-voice');
    const voiceToggle = document.getElementById('vemu-ai-voice-toggle');
    const input = document.getElementById('vemu-ai-input');
    const messages = document.getElementById('vemu-ai-messages');
    const setVoiceToggleText = () => voiceToggle.textContent = localStorage.getItem(STORAGE_KEYS.assistantVoice) === 'off' ? 'Voice replies off' : 'Voice replies on';
    setVoiceToggleText();
    const openPanel = () => {
        panel.style.display = 'block';
        if (!messages.dataset.booted) {
            appendAssistantMessage(messages, getAssistantWelcome());
            appendAssistantMessage(messages, getAssistantQuickSummary());
            messages.dataset.booted = '1';
        }
    };
    launcher.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', () => panel.style.display = 'none');
    const submitAssistant = async () => {
        const text = String(input.value || '').trim();
        if (!text) return;
        appendAssistantMessage(messages, text, 'user');
        input.value = '';
        let localReply = '';
        try { localReply = handleAssistantCommand(text); } catch (error) { localReply = ''; }
        const serverReply = await callServerJson('/api/assistant/chat', {
            message: text,
            user: getCurrentUser() || null
        });
        const reply = serverReply.ok && serverReply.reply ? serverReply.reply : (localReply || 'Assistant is ready.');
        window.setTimeout(() => appendAssistantMessage(messages, reply, 'assistant'), 160);
    };
    sendBtn.addEventListener('click', submitAssistant);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitAssistant(); }
    });
    voiceToggle.addEventListener('click', () => {
        const off = localStorage.getItem(STORAGE_KEYS.assistantVoice) === 'off';
        localStorage.setItem(STORAGE_KEYS.assistantVoice, off ? 'on' : 'off');
        setVoiceToggleText();
    });
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
        voiceBtn.disabled = true;
        voiceBtn.title = 'Voice assist not supported in this browser';
    } else {
        const recognition = new Recognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        voiceBtn.addEventListener('click', () => {
            try { recognition.start(); } catch (error) {}
        });
        recognition.onresult = event => {
            const transcript = event.results?.[0]?.[0]?.transcript || '';
            input.value = transcript;
            submitAssistant();
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initAssets();
    initScrollReveal();
    mountThemeToggle();
    ensureSidebarToggle();
    mountDashboardGreetingCard();
    updateHomeLiveStats();
    renderHomeFeedback();
    window.setTimeout(() => {
        updateHomeLiveStats();
        renderHomeFeedback();
    }, 150);
    if (document.getElementById('home-live-time')) {
        updateHomeLiveClock();
        window.setInterval(updateHomeLiveClock, 30000);
    }
    mountMonthlyFeedbackPrompt();
    renderLibraryPulseNode();
    const aiLauncher = document.getElementById('vemu-ai-launcher'); if (aiLauncher) aiLauncher.remove();
    const aiPanel = document.getElementById('vemu-ai-panel'); if (aiPanel) aiPanel.remove();
    if (document.querySelector('.stats-intensive')) initCounters();
    if (getServerApiBase()) {
        bootstrapServerBackedState().then(() => {
            updateHomeLiveStats();
            renderHomeFeedback();
        }).catch(() => {});
        scheduleServerStateSync(900);
    }
});


window.addEventListener('beforeunload', () => {
    if (!getServerApiBase()) return;
    try { syncPortableLibraryState(); } catch (error) {}
});


(function patchAllMutations() {
    const funcs = [
        "submitBookSuggestion",
        "submitFacultySuggestion",
        "submitStudentSuggestion",
        "markFinePaidForCurrentUser",
        "requestRenewal",
        "addBook",
        "issueBook",
        "returnBook",
        "deleteUser",
        "createUser",
        "updateUser",
        "approveSuggestion",
        "rejectSuggestion",
        "saveFeedbackEntries"
    ];

    funcs.forEach(name => {
        const original = window[name];
        if (typeof original !== 'function') return;

        window[name] = function (...args) {
            const result = original.apply(this, args);

            autoSyncSafe(); // 🔥 main trigger

            return result;
        };
    });
})();

function getManageableUsers(role) {
    const users = getUsers(); // existing function

    if (role === 'admin') {
        return users;
    }

    if (role === 'librarian') {
        return users.filter(user =>
            user.role === 'student' || user.role === 'faculty'
        );
    }

    return [];
}
(function () {
    const sidebarBtn = document.getElementById('sidebar-toggle-mobile');
    const sidebar = document.querySelector('.sidebar');

    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }

    function closeSidebar() {
        sidebar?.classList.remove('active');
        overlay.classList.remove('active');
    }

    function openSidebar() {
        sidebar?.classList.add('active');
        overlay.classList.add('active');
    }

    sidebarBtn?.addEventListener('click', () => {
        if (!sidebar) return;
        const isOpen = sidebar.classList.contains('active');
        if (isOpen) closeSidebar();
        else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    const navBtn = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    navBtn?.addEventListener('click', () => {
        navLinks?.classList.toggle('active');
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks?.classList.remove('active');
        }
    });
})();

function forceAutosave() {
  autoSyncSafe();
  scheduleServerStateSync();
}

