import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboard({ token }) {
    const [metrics, setMetrics] = useState({ total_users: 0, total_stores: 0, total_ratings: 0 });
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);

    // Form states
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserAddress, setNewUserAddress] = useState('');
    const [newUserRole, setNewUserRole] = useState('NORMAL_USER');

    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreEmail, setNewStoreEmail] = useState('');
    const [newStoreAddress, setNewStoreAddress] = useState('');
    const [newStoreOwnerId, setNewStoreOwnerId] = useState('');

    // Filtering & Sorting
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [userSortField, setUserSortField] = useState('name');
    const [userSortOrder, setUserSortOrder] = useState('asc');

    const [storeSearch, setStoreSearch] = useState('');
    const [storeSortField, setStoreSortField] = useState('name');
    const [storeSortOrder, setStoreSortOrder] = useState('asc');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const loadData = async () => {
        try {
            const [resMetrics, resUsers, resStores] = await Promise.all([
                axios.get(`${API_BASE}/admin/dashboard`, config),
                axios.get(`${API_BASE}/admin/users`, config),
                axios.get(`${API_BASE}/admin/stores`, config)
            ]);
            setMetrics(resMetrics.data);
            setUsers(resUsers.data);
            setStores(resStores.data);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/admin/users`, {
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                address: newUserAddress,
                role: newUserRole
            }, config);
            alert('User created successfully');
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserAddress('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/admin/stores`, {
                name: newStoreName,
                email: newStoreEmail,
                address: newStoreAddress,
                owner_id: newStoreOwnerId || null
            }, config);
            alert('Store created successfully');
            setNewStoreName('');
            setNewStoreEmail('');
            setNewStoreAddress('');
            setNewStoreOwnerId('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create store');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API_BASE}/admin/users/${id}`, config);
            alert('User deleted');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleDeleteStore = async (id) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        try {
            await axios.delete(`${API_BASE}/admin/stores/${id}`, config);
            alert('Store deleted');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete store');
        }
    };

    const handleAssignOwner = async (storeId, newOwnerId) => {
        try {
            await axios.put(
                `${API_BASE}/admin/stores/${storeId}/assign-owner`,
                { owner_id: newOwnerId ? parseInt(newOwnerId) : null },
                config
            );
            alert('Store owner updated successfully!');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to assign owner');
        }
    };

    // Filter & Sort Users
    const filteredUsers = users
        .filter(u => {
            const matchSearch =
                u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.address.toLowerCase().includes(userSearch.toLowerCase());
            const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
            return matchSearch && matchRole;
        })
        .sort((a, b) => {
            let valA = a[userSortField] || '';
            let valB = b[userSortField] || '';
            if (typeof valA === 'string') {
                return userSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return userSortOrder === 'asc' ? valA - valB : valB - valA;
        });

    // Filter & Sort Stores (Including Owner Name)
    const filteredStores = stores
        .filter(s => {
            const owner = s.owner_name || '';
            return (
                s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                s.email.toLowerCase().includes(storeSearch.toLowerCase()) ||
                s.address.toLowerCase().includes(storeSearch.toLowerCase()) ||
                owner.toLowerCase().includes(storeSearch.toLowerCase())
            );
        })
        .sort((a, b) => {
            let valA = a[storeSortField] || '';
            let valB = b[storeSortField] || '';
            if (typeof valA === 'string') {
                return storeSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return storeSortOrder === 'asc' ? valA - valB : valB - valA;
        });

    const handleUserSort = (field) => {
        if (userSortField === field) {
            setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setUserSortField(field);
            setUserSortOrder('asc');
        }
    };

    const handleStoreSort = (field) => {
        if (storeSortField === field) {
            setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setStoreSortField(field);
            setStoreSortOrder('asc');
        }
    };

    const ownersList = users.filter(u => u.role === 'STORE_OWNER');

    return (
        <div>
            {/* Metric Counters */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <p>Total Registered Users</p>
                    <h3>{metrics.total_users}</h3>
                </div>
                <div className="metric-card">
                    <p>Total Stores</p>
                    <h3>{metrics.total_stores}</h3>
                </div>
                <div className="metric-card">
                    <p>Submitted Ratings</p>
                    <h3>{metrics.total_ratings}</h3>
                </div>
            </div>

            {/* Forms Grid */}
            <div className="card-grid">
                <div className="card">
                    <h3>Add New User</h3>
                    <form onSubmit={handleCreateUser}>
                        <div className="input-group">
                            <label>Full Name (20-60 characters)</label>
                            <input value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Password (8-16 chars, 1 Uppercase, 1 Special)</label>
                            <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Address (Max 400 characters)</label>
                            <input value={newUserAddress} onChange={e => setNewUserAddress(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Role</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                <option value="NORMAL_USER">NORMAL_USER</option>
                                <option value="STORE_OWNER">STORE_OWNER</option>
                                <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                            </select>
                        </div>
                        <button className="btn-primary" type="submit">Create User</button>
                    </form>
                </div>

                <div className="card">
                    <h3>Add New Store</h3>
                    <form onSubmit={handleCreateStore}>
                        <div className="input-group">
                            <label>Store Name (20-60 characters)</label>
                            <input value={newStoreName} onChange={e => setNewStoreName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Store Contact Email</label>
                            <input type="email" value={newStoreEmail} onChange={e => setNewStoreEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Store Address (Max 400 characters)</label>
                            <input value={newStoreAddress} onChange={e => setNewStoreAddress(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Assign Store Owner (Optional)</label>
                            <select value={newStoreOwnerId} onChange={e => setNewStoreOwnerId(e.target.value)}>
                                <option value="">-- No Owner Assigned --</option>
                                {ownersList.map(owner => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name} ({owner.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button className="btn-primary" type="submit">Create Store</button>
                    </form>
                </div>
            </div>

            {/* Registered Users Table */}
            <div className="table-wrapper">
                <div className="table-header-box">
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Registered Users</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Filter by Name, Email, Address..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            style={{ width: '240px' }}
                        />
                        <select
                            value={userRoleFilter}
                            onChange={e => setUserRoleFilter(e.target.value)}
                            style={{ width: '150px' }}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="SYSTEM_ADMIN">Admin</option>
                            <option value="NORMAL_USER">Normal User</option>
                            <option value="STORE_OWNER">Store Owner</option>
                        </select>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleUserSort('name')}>
                                NAME {userSortField === 'name' ? (userSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleUserSort('email')}>
                                EMAIL {userSortField === 'email' ? (userSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleUserSort('address')}>
                                ADDRESS {userSortField === 'address' ? (userSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleUserSort('role')}>
                                ROLE {userSortField === 'role' ? (userSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th>OWNER STORE RATING</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.address}</td>
                                <td><span className="user-badge" style={{ margin: 0 }}>{u.role}</span></td>
                                <td>
                                    {u.role === 'STORE_OWNER' ? (
                                        <span style={{ color: '#d97706', fontWeight: 700 }}>
                                            ★ {Number(u.owner_store_rating || 0).toFixed(1)}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>—</span>
                                    )}
                                </td>
                                <td>
                                    {u.role !== 'SYSTEM_ADMIN' ? (
                                        <button
                                            className="btn-danger"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                            onClick={() => handleDeleteUser(u.id)}
                                        >
                                            Delete
                                        </button>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Protected</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Registered Stores Table with Assignment Control */}
            <div className="table-wrapper">
                <div className="table-header-box">
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Registered Stores</h3>
                    <input
                        type="text"
                        placeholder="Filter stores by Name, Owner, Email, Address..."
                        value={storeSearch}
                        onChange={e => setStoreSearch(e.target.value)}
                        style={{ maxWidth: '320px' }}
                    />
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleStoreSort('name')}>
                                STORE NAME {storeSortField === 'name' ? (storeSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleStoreSort('owner_name')}>
                                CURRENT OWNER {storeSortField === 'owner_name' ? (storeSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleStoreSort('email')}>
                                EMAIL {storeSortField === 'email' ? (storeSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleStoreSort('address')}>
                                ADDRESS {storeSortField === 'address' ? (storeSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th className="sortable" onClick={() => handleStoreSort('overall_rating')}>
                                OVERALL RATING {storeSortField === 'overall_rating' ? (storeSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th>ASSIGN / CHANGE OWNER</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStores.map(store => (
                            <tr key={store.id}>
                                <td style={{ fontWeight: 600 }}>{store.name}</td>
                                <td>
                                    {store.owner_name ? (
                                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {store.owner_name}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Unassigned</span>
                                    )}
                                </td>
                                <td>{store.email}</td>
                                <td>{store.address}</td>
                                <td style={{ color: '#d97706', fontWeight: 700 }}>
                                    ★ {Number(store.overall_rating || 0).toFixed(1)}
                                </td>
                                <td>
                                    <select
                                        value={store.owner_id || ''}
                                        onChange={e => handleAssignOwner(store.id, e.target.value)}
                                        style={{ maxWidth: '220px', padding: '6px 10px', fontSize: '0.8rem' }}
                                    >
                                        <option value="">-- No Owner (Unassigned) --</option>
                                        {ownersList.map(o => (
                                            <option key={o.id} value={o.id}>
                                                {o.name} ({o.email})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className="btn-danger"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        onClick={() => handleDeleteStore(store.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredStores.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                    No stores found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}