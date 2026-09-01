import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function UserDashboard({ token }) {
    const [stores, setStores] = useState([]);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchStores = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            // First attempt: default user store endpoint
            const res = await axios.get(`${API_BASE}/stores`, {
                params: { search: search || undefined },
                headers
            });
            setStores(Array.isArray(res.data) ? res.data : (res.data?.stores || []));
        } catch (err) {
            // Fallback attempt: if /stores gave 404, try /admin/stores or /store
            if (err.response && err.response.status === 404) {
                try {
                    const fallbackRes = await axios.get(`${API_BASE}/admin/stores`, {
                        params: { search: search || undefined },
                        headers
                    });
                    setStores(Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.stores || []));
                    setLoading(false);
                    return;
                } catch (fallbackErr) {
                    console.error('Fallback endpoint also failed:', fallbackErr);
                }
            }
            console.error('Fetch stores error:', err);
            setErrorMessage('Could not load stores. Please ensure the backend server route is running.');
            setStores([]);
        } finally {
            setLoading(false);
        }
    }, [token, search]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleRateStore = async (storeId, rating) => {
        try {
            await axios.post(`${API_BASE}/ratings`, { store_id: storeId, rating }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Rating submitted successfully!');
            fetchStores();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit rating');
        }
    };

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(order);
    };

    const sortedStores = [...stores].sort((a, b) => {
        if (sortField === 'overallRating') {
            const rA = Number(a.overallRating || a.rating || a.averageRating) || 0;
            const rB = Number(b.overallRating || b.rating || b.averageRating) || 0;
            return sortOrder === 'asc' ? rA - rB : rB - rA;
        }
        const aVal = (a[sortField] || '').toString().toLowerCase();
        const bVal = (b[sortField] || '').toString().toLowerCase();
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return (
        <div className="table-wrapper">
            <div className="table-header-box">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Explore Registered Stores</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        placeholder="Search by Name or Address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchStores()}
                        style={{ width: '260px' }}
                    />
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', marginTop: 0 }}
                        onClick={fetchStores}
                    >
                        Search
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '12px', fontSize: '0.875rem' }}>
                    {errorMessage}
                </div>
            )}

            <table>
                <thead>
                    <tr>
                        <th className="sortable" onClick={() => handleSort('name')}>
                            Store Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="sortable" onClick={() => handleSort('address')}>
                            Address {sortField === 'address' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="sortable" onClick={() => handleSort('overallRating')}>
                            Overall Rating {sortField === 'overallRating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th>My Submitted Rating</th>
                        <th>Submit / Modify Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>Loading stores...</td>
                        </tr>
                    ) : sortedStores.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No stores found.</td>
                        </tr>
                    ) : (
                        sortedStores.map((s) => {
                            const storeId = s.id || s._id;
                            const ratingVal = s.overallRating || s.rating || s.averageRating;

                            return (
                                <tr key={storeId}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td>{s.address}</td>
                                    <td style={{ color: '#d97706', fontWeight: 600 }}>
                                        {ratingVal ? `★ ${Number(ratingVal).toFixed(1)}` : 'No ratings'}
                                    </td>
                                    <td>
                                        {s.myRating ? (
                                            <span style={{ fontWeight: 600, color: '#4f46e5' }}>★ {s.myRating}</span>
                                        ) : (
                                            <span style={{ color: '#64748b' }}>Not rated</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="rating-pill">
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handleRateStore(storeId, num)}
                                                    className={`rating-btn ${s.myRating === num ? 'active' : ''}`}
                                                >
                                                    {num} ★
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}