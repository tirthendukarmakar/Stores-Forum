import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function PasswordModal({ token, onClose }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return alert('Passwords do not match');
        }

        try {
            await axios.put(`${API_BASE}/auth/update-password`, { newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Password updated successfully!');
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update password');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>Change Account Password</h3>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>New Password (8-16 chars, 1 Upper, 1 Special)</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button className="btn-primary" type="submit" style={{ marginTop: 0 }}>Save Password</button>
                        <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}