import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function UserDashboard({ token }) {
    const [stores, setStores] = useState([]);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const fetchStores = async () => {
        try {
            const res = await axios.get(`${API_BASE}/stores?search=${encodeURIComponent(search)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStores(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [token]);

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
            const rA = Number(a.overallRating) || 0;
            const rB = Number(b.overallRating) || 0;
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
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '260px' }}
                    />
                    <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={fetchStores}>Search</button>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th className="sortable" onClick={() => handleSort('name')}>Store Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                        <th className="sortable" onClick={() => handleSort('address')}>Address {sortField === 'address' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                        <th className="sortable" onClick={() => handleSort('overallRating')}>Overall Rating {sortField === 'overallRating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                        <th>My Submitted Rating</th>
                        <th>Submit / Modify Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStores.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No stores found.</td></tr>
                    ) : (
                        sortedStores.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                <td>{s.address}</td>
                                <td style={{ color: '#d97706', fontWeight: 600 }}>
                                    {s.overallRating ? `★ ${Number(s.overallRating).toFixed(1)}` : 'No ratings'}
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
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => handleRateStore(s.id, num)}
                                                className={`rating-btn ${s.myRating === num ? 'active' : ''}`}
                                            >
                                                {num} ★
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}