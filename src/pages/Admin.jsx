import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, ADMIN_CREDENTIALS, STORAGE_KEYS } from '../supabase'

function Admin() {
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(null)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('dashboard')

    // Data states
    const [events, setEvents] = useState([])
    const [users, setUsers] = useState([])
    const [pendingPayments, setPendingPayments] = useState([])
    const [upgradeRequests, setUpgradeRequests] = useState([])
    const [gifts, setGifts] = useState([])
    const [photoCount, setPhotoCount] = useState(0)
    const [supabasePhotoCount, setSupabasePhotoCount] = useState(0)
    const [viewerCount, setViewerCount] = useState(0)
    const [momoNumber, setMomoNumber] = useState('')
    const [momoStatus, setMomoStatus] = useState(false)
    const [shareLink, setShareLink] = useState('')
    const [copyStatus, setCopyStatus] = useState(false)
    const [showUserModal, setShowUserModal] = useState(false)
    const [newUserName, setNewUserName] = useState('')
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newUserRole, setNewUserRole] = useState('user')

    // UI states
    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [syncingLocalRequests, setSyncingLocalRequests] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === 'true') {
            setIsLoggedIn(true)
            setUser(JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null'))
            loadData()
        }
        setShareLink(window.location.origin + '/upload')
        const views = parseInt(localStorage.getItem(STORAGE_KEYS.VIEWS) || '0')
        setViewerCount(views)
    }, [])

    async function loadData() {
        await Promise.all([
            loadEvents(),
            loadUsers(),
            loadPendingPayments(),
            loadUpgradeRequests(),
            loadGifts(),
            loadPhotosCount(),
            loadMomoNumber()
        ])
    }

    async function loadEvents() {
        try {
            const { data, error } = await supabase
                .from('event_registry')
                .select('*')
                .order('created_at', { ascending: false })

            if (data && !error) {
                setEvents(data)
                console.log('Loaded events:', data.length)
            }
        } catch (err) {
            console.log('Error loading events:', err)
        }
    }

    async function loadUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (data && !error) {
                setUsers(data)
            }
        } catch (err) {
            console.log('Error loading users:', err)
            const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
            setUsers(local)
        }
    }

    async function loadPendingPayments() {
        try {
            const pending = localStorage.getItem('pending_payments') || '[]'
            setPendingPayments(JSON.parse(pending))
        } catch (err) {
            console.log('Error loading pending payments:', err)
        }
    }

    async function loadUpgradeRequests() {
        try {
            const { data, error } = await supabase
                .from('upgrade_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (data && !error) {
                setUpgradeRequests(data)
            }
        } catch (err) {
            console.log('Error loading upgrade requests:', err)
        }
    }

    async function loadGifts() {
        const giftsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.GIFTS) || '[]')
        setGifts(giftsData)
    }

    async function loadPhotosCount() {
        const photos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS) || '[]')
        setPhotoCount(photos.length)
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*', { count: 'exact' })
            if (data) setSupabasePhotoCount(data.length)
        } catch (err) {
            console.log('Supabase photos not available')
        }
    }

    async function loadMomoNumber() {
        // localStorage only — Supabase config table may not exist (406)
        const momo = localStorage.getItem(STORAGE_KEYS.MOM0)
        if (momo) {
            setMomoNumber(momo)
        }
    }

    function saveMomoNumber() {
        localStorage.setItem(STORAGE_KEYS.MOM0, momoNumber)
        // Supabase config table may not exist — localStorage is source of truth
        if (supabase) {
            supabase.from('config').upsert({ key: 'momo_number', value: momoNumber }).catch(() => { })
        }
        setMomoStatus(true)
        setTimeout(() => setMomoStatus(false), 3000)
    }

    function clearAllPhotos() {
        if (confirm('Clear all photos? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEYS.PHOTOS)
            setPhotoCount(0)
            alert('All photos cleared!')
        }
    }

    function copyShareLink() {
        navigator.clipboard.writeText(shareLink)
        setCopyStatus(true)
        setTimeout(() => setCopyStatus(false), 2000)
    }

    function addNewUser() {
        if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
            alert('Please fill all fields')
            return
        }
        const existingUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
        if (existingUsers.some(u => u.email === newUserEmail)) {
            alert('User already exists')
            return
        }
        const newUser = {
            id: Date.now().toString(),
            name: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole,
            package_tier: 'free',
            package_name: 'free',
            payment_status: null,
            created_at: new Date().toISOString()
        }
        existingUsers.push(newUser)
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers))
        setUsers(existingUsers)
        setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('user')
        setShowUserModal(false)
        alert('User added!')
    }

    async function confirmPayment(paymentId, packageTier) {
        // Implementation
        alert(`Payment confirmed for ${packageTier}`)
        await loadPendingPayments()
    }

    async function rejectPayment(paymentId) {
        if (confirm('Reject this payment?')) {
            const pending = pendingPayments.filter(p => p.id !== paymentId)
            localStorage.setItem('pending_payments', JSON.stringify(pending))
            setPendingPayments(pending)
            alert('Payment rejected')
        }
    }

    async function approveUpgradeRequest(requestId) {
        alert(`Upgrade request ${requestId} approved`)
        await loadUpgradeRequests()
    }

    async function rejectUpgradeRequest(requestId) {
        if (confirm('Reject this upgrade request?')) {
            alert(`Upgrade request ${requestId} rejected`)
            await loadUpgradeRequests()
        }
    }

    function handleLogin(e) {
        e.preventDefault()
        const enteredUsername = username.trim().toLowerCase()
        const enteredPassword = password.trim()
        const validUsername = enteredUsername === ADMIN_CREDENTIALS.username
        const validPassword = [ADMIN_CREDENTIALS.password, ...(ADMIN_CREDENTIALS.fallbackPasswords || [])].includes(enteredPassword)
        if (validUsername && validPassword) {
            setIsLoggedIn(true)
            setError(false)
            const adminUser = { id: 'admin', name: 'Administrator', role: 'super_admin' }
            setUser(adminUser)
            localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true')
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser))
            loadData()
        } else {
            setError(true)
        }
    }

    function handleLogout() {
        setIsLoggedIn(false)
        setUser(null)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN)
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
        setActiveTab('dashboard')
    }

    // Stats calculations
    const stats = {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'active').length,
        totalUsers: users.length,
        paidUsers: users.filter(u => u.payment_status === 'confirmed').length,
        pendingPayments: pendingPayments.length,
        pendingUpgrades: upgradeRequests.length,
        totalPhotos: photoCount + supabasePhotoCount,
        totalGifts: gifts.length,
        pageViews: viewerCount
    }

    const eventTypes = {
        birthday: events.filter(e => e.event_type === 'birthday').length,
        wedding: events.filter(e => e.event_type === 'wedding').length,
        anniversary: events.filter(e => e.event_type === 'anniversary').length,
        party: events.filter(e => e.event_type === 'party').length,
        hangout: events.filter(e => e.event_type === 'hangout').length,
        other: events.filter(e => e.event_type === 'other').length
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
<div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
    <img src="https://res.cloudinary.com/djjgkezui/image/upload/v1778959179/IMG-20260516-WA0050_zegaok.jpg" alt="Logo" className="w-full h-full object-center" />
</div>
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                        <p className="text-purple-200">Secure access only</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                    <p className="text-red-200 text-sm text-center">Invalid credentials. Please try again.</p>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02]"
                            >
                                Sign In 🔐
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 lg:grid lg:grid-cols-[280px_1fr]">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-md shadow-2xl transform transition-all duration-300 lg:static lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:border-r lg:border-gray-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
<div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
    <img src="https://res.cloudinary.com/djjgkezui/image/upload/v1778959179/IMG-20260516-WA0050_zegaok.jpg" alt="Logo" className="w-full h-full object-center" />
</div>
                            <div>
                                <h2 className="font-bold text-gray-800 text-lg">Admin Panel</h2>
                                <p className="text-xs text-gray-500">{user?.name}</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-6 lg:hidden p-2 rounded-lg hover:bg-gray-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'rose' },
                            { id: 'events', label: 'Events', icon: '🎉', color: 'indigo' },
                            { id: 'users', label: 'Users', icon: '👥', color: 'blue' },
                            { id: 'upgrades', label: 'Upgrades', icon: '⬆️', color: 'purple' },
                            { id: 'payments', label: 'Payments', icon: '💰', color: 'green' },
                            { id: 'gifts', label: 'Gifts', icon: '🎁', color: 'yellow' },
                            { id: 'settings', label: 'Settings', icon: '⚙️', color: 'gray' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? `bg-gradient-to-r from-${tab.color}-50 to-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm`
                                    : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                                {tab.id === 'upgrades' && stats.pendingUpgrades > 0 && (
                                    <span className="ml-auto bg-rose-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                                        {stats.pendingUpgrades}
                                    </span>
                                )}
                                {tab.id === 'payments' && stats.pendingPayments > 0 && (
                                    <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full px-2 py-1">
                                        {stats.pendingPayments}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-lg hover:bg-gray-100 relative">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5H9v-5H7v5H3v-5H1v12h14V7h-2z" />
                                </svg>
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Hero Section */}
                            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
                                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Event Dashboard</h2>
                                <p className="text-white/90">Manage all your events, users, and analytics from one place</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                <StatCard value={stats.totalEvents} label="Total Events" icon="🎉" color="rose" />
                                <StatCard value={stats.activeEvents} label="Active Events" icon="✅" color="green" />
                                <StatCard value={stats.totalUsers} label="Total Users" icon="👥" color="blue" />
                                <StatCard value={stats.paidUsers} label="Paid Users" icon="💰" color="purple" />
                                <StatCard value={stats.totalPhotos} label="Photos" icon="📸" color="orange" />
                                <StatCard value={stats.totalGifts} label="Gifts" icon="🎁" color="yellow" />
                            </div>

                            {/* Event Types Breakdown */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📊</span> Events by Type
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <EventTypeCard type="Birthday" count={eventTypes.birthday} icon="🎂" color="rose" />
                                    <EventTypeCard type="Wedding" count={eventTypes.wedding} icon="💍" color="pink" />
                                    <EventTypeCard type="Anniversary" count={eventTypes.anniversary} icon="💕" color="red" />
                                    <EventTypeCard type="Party" count={eventTypes.party} icon="🎉" color="purple" />
                                    <EventTypeCard type="Hangout" count={eventTypes.hangout} icon="👋" color="blue" />
                                    <EventTypeCard type="Other" count={eventTypes.other} icon="📅" color="gray" />
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">⚡</span> Quick Actions
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <QuickAction to="/create-event" icon="✨" label="Create Event" color="rose" />
                                    <QuickAction to="/upload" icon="📤" label="Upload Photos" color="purple" />
                                    <QuickAction to="/slideshow" icon="🎬" label="Slideshow" color="blue" />
                                    <QuickAction onClick={clearAllPhotos} icon="🗑️" label="Clear Photos" color="red" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">All Events</h2>
                                    <p className="text-gray-600">Manage all event pages created by users</p>
                                </div>
                                <Link to="/create-event" className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-center">
                                    + Create Event
                                </Link>
                            </div>

                            {events.length === 0 ? (
                                <EmptyState icon="🎉" title="No events yet" message="Events will appear here once users create them." />
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {events.slice(0, 50).map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                                    <p className="text-gray-600">Manage registered users and their packages</p>
                                </div>
                                <button onClick={() => setShowUserModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                                    + Add User
                                </button>
                            </div>

                            {users.length === 0 ? (
                                <EmptyState icon="👥" title="No users yet" message="Users will appear here once they register." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {users.map((user) => (
                                        <UserCard key={user.id} user={user} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upgrades Tab */}
                    {activeTab === 'upgrades' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Package Upgrade Requests</h2>
                                <p className="text-gray-600">Review and approve user upgrade requests</p>
                            </div>

                            {upgradeRequests.length === 0 ? (
                                <EmptyState icon="✅" title="No pending upgrades" message="All upgrade requests have been processed." />
                            ) : (
                                <div className="space-y-4">
                                    {upgradeRequests.map((request) => (
                                        <UpgradeRequestCard key={request.id} request={request} onApprove={approveUpgradeRequest} onReject={rejectUpgradeRequest} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Payment Processing</h2>
                                <p className="text-gray-600">Review and confirm pending payments</p>
                            </div>

                            {pendingPayments.length === 0 ? (
                                <EmptyState icon="✅" title="No pending payments" message="All payments have been processed." />
                            ) : (
                                <div className="space-y-4">
                                    {pendingPayments.map((payment, index) => (
                                        <PaymentCard key={index} payment={payment} onConfirm={confirmPayment} onReject={rejectPayment} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gifts Tab */}
                    {activeTab === 'gifts' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Gift Registry</h2>
                                <p className="text-gray-600">View all gifts sent through event pages</p>
                            </div>

                            {gifts.length === 0 ? (
                                <EmptyState icon="🎁" title="No gifts yet" message="Gifts will appear here once sent." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {gifts.slice().reverse().slice(0, 30).map((gift, index) => (
                                        <GiftCard key={index} gift={gift} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                                <p className="text-gray-600">Configure your application settings</p>
                            </div>

                            {/* Share Link Section */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📲</span> Share Upload Link
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input type="text" readOnly value={shareLink} className="flex-1 p-3 border-2 border-gray-200 rounded-xl bg-gray-50" />
                                    <button onClick={copyShareLink} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium whitespace-nowrap">
                                        Copy Link 📋
                                    </button>
                                </div>
                                {copyStatus && <div className="mt-3 p-3 bg-green-50 rounded-lg"><p className="text-green-700 text-sm">✅ Link copied!</p></div>}
                            </div>

                            {/* MoMo Settings */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">💰</span> Mobile Money Settings
                                </h3>
                                <div className="space-y-4">
                                    <input type="text" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="MoMo number (e.g., 0531114795)" className="w-full p-3 border-2 border-gray-200 rounded-xl" />
                                    <button onClick={saveMomoNumber} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold">
                                        Save MoMo Number 💾
                                    </button>
                                    {momoStatus && <div className="p-3 bg-green-50 rounded-lg"><p className="text-green-700 text-sm">✅ MoMo number saved!</p></div>}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Add User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
                            <button onClick={() => setShowUserModal(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl" />
                            <input type="email" placeholder="Email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl" />
                            <input type="password" placeholder="Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl" />
                            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button onClick={addNewUser} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl font-semibold">Create User ✨</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper Components
const StatCard = ({ value, label, icon, color }) => {
    const colors = { rose: 'from-rose-50 to-pink-50 text-rose-600', green: 'from-green-50 to-emerald-50 text-green-600', blue: 'from-blue-50 to-indigo-50 text-blue-600', purple: 'from-purple-50 to-violet-50 text-purple-600', orange: 'from-orange-50 to-amber-50 text-orange-600', yellow: 'from-yellow-50 to-amber-50 text-yellow-600' }
    return (
        <div className={`bg-gradient-to-r ${colors[color]} p-4 rounded-xl shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs opacity-80">{label}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    )
}

const EventTypeCard = ({ type, count, icon, color }) => {
    const colors = { rose: 'bg-rose-50 text-rose-600', pink: 'bg-pink-50 text-pink-600', red: 'bg-red-50 text-red-600', purple: 'bg-purple-50 text-purple-600', blue: 'bg-blue-50 text-blue-600', gray: 'bg-gray-50 text-gray-600' }
    return (
        <div className={`${colors[color]} p-4 rounded-xl text-center`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs">{type}</div>
        </div>
    )
}

const QuickAction = ({ to, onClick, icon, label, color }) => {
    const colors = { rose: 'from-rose-100 to-pink-100 hover:from-rose-200', purple: 'from-purple-100 to-violet-100 hover:from-purple-200', blue: 'from-blue-100 to-indigo-100 hover:from-blue-200', red: 'from-red-100 to-pink-100 hover:from-red-200' }
    const content = (
        <div className={`bg-gradient-to-r ${colors[color]} p-4 rounded-xl text-center transition-all hover:shadow-md cursor-pointer`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm font-medium text-gray-700">{label}</div>
        </div>
    )
    if (to) return <Link to={to}>{content}</Link>
    return <button onClick={onClick} className="w-full">{content}</button>
}

const EmptyState = ({ icon, title, message }) => (
    <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500">{message}</p>
    </div>
)

const EventCard = ({ event }) => {
    const eventIcons = { birthday: '🎂', wedding: '💍', anniversary: '💕', party: '🎉', hangout: '👋', other: '📅' }
    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl shadow-md">
                        {eventIcons[event.event_type] || '🎉'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{event.event_name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{event.event_type}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {event.status}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold text-gray-800 text-sm">{new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Code</p>
                    <p className="font-mono font-semibold text-rose-600 text-sm">{event.code}</p>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <Link to={`/event/${event.code}`} className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium text-center hover:bg-rose-100">👁️ View</Link>
                <Link to={`/edit-event/${event.code}`} className="flex-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium text-center hover:bg-amber-100">✏️ Edit</Link>
            </div>
        </div>
    )
}

const UserCard = ({ user }) => (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{user.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.package_tier === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                {user.package_tier}
            </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>📅</span>
            <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
        </div>
    </div>
)

const PaymentCard = ({ payment, onConfirm, onReject }) => (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                        {payment.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{payment.name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-500">{payment.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Package</p>
                        <p className="font-semibold capitalize">{payment.package_tier}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold">GHS {payment.amount}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onConfirm(payment.id, payment.package_tier)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">✅ Confirm</button>
                <button onClick={() => onReject(payment.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">❌ Reject</button>
            </div>
        </div>
    </div>
)

const UpgradeRequestCard = ({ request, onApprove, onReject }) => (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                    {request.user_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{request.user_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{request.user_email}</p>
                </div>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold animate-pulse">PENDING</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Current</p>
                <p className="font-semibold capitalize">{request.from_package_tier || 'Free'}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Requested</p>
                <p className="font-semibold capitalize">{request.to_package_tier}</p>
            </div>
        </div>
        {request.amount_paid > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Amount Paid: <strong>GHS {request.amount_paid}</strong></p>
                {request.transaction_id && <p className="text-xs text-gray-500 mt-1">TxID: {request.transaction_id}</p>}
            </div>
        )}
        <div className="flex gap-2">
            <button onClick={() => onApprove(request.id)} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">✅ Approve</button>
            <button onClick={() => onReject(request.id)} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">❌ Reject</button>
        </div>
    </div>
)

const GiftCard = ({ gift }) => (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
        <div className="flex items-start justify-between mb-2">
            <div className="font-bold text-rose-700">{gift.name}</div>
            <div className="text-xs text-gray-500">{new Date(gift.date).toLocaleDateString()}</div>
        </div>
        <p className="text-gray-600 text-sm">{gift.message}</p>
    </div>
)

export default Admin