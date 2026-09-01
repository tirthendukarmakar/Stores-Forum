import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function OwnerDashboard({ token }) {
    const [data, setData] = useState({ averageRating: 0, reviewers: [] });
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        const fetchOwnerData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/owner/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchOwnerData();
    }, [token]);

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(order);
    };

    const sortedReviewers = [...(data.reviewers || [])].sort((a, b) => {
        if (sortField === 'rating') {
            return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
        }
        if (sortField === 'updated_at') {
            return sortOrder === 'asc'
                ? new Date(a.updated_at) - new Date(b.updated_at)
                : new Date(b.updated_at) - new Date(a.updated_at);
        }
        const aVal = (a[sortField] || '').toString().toLowerCase();
        const bVal = (b[sortField] || '').toString().toLowerCase();
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return (
        <div>
            <div className="metric-card" style={{ maxWidth: '300px', marginBottom: '28px' }}>
                <p>Average Store Rating</p>
                <h3 style={{ color: '#d97706' }}>
                    {data.averageRating ? `★ ${Number(data.averageRating).toFixed(1)}` : 'No ratings yet'}
                </h3>
            </div>

            <div className="table-wrapper">
                <div className="table-header-box">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Customers Who Rated Your Store</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleSort('name')}>User Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                            <th className="sortable" onClick={() => handleSort('email')}>User Email {sortField === 'email' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                            <th className="sortable" onClick={() => handleSort('rating')}>Submitted Rating {sortField === 'rating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                            <th className="sortable" onClick={() => handleSort('updated_at')}>Date {sortField === 'updated_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedReviewers.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No user ratings submitted yet.</td></tr>
                        ) : (
                            sortedReviewers.map((r, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                                    <td style={{ color: '#64748b' }}>{r.email}</td>
                                    <td style={{ color: '#d97706', fontWeight: 600 }}>★ {r.rating}</td>
                                    <td>{new Date(r.updated_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}