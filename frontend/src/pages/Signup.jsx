import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Poppins']">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="First Name" required className="w-full border p-2 rounded"
            onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <input type="text" placeholder="Last Name" required className="w-full border p-2 rounded"
            onChange={e => setForm({ ...form, lastName: e.target.value })} />
          <input type="email" placeholder="Email" required className="w-full border p-2 rounded"
            onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password" required minLength={6} className="w-full border p-2 rounded"
            onChange={e => setForm({ ...form, password: e.target.value })} />
          <button type="submit" className="w-full bg-[#5348C7] text-white p-2 rounded hover:bg-[#4239a8]">
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-[#5348C7] font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}