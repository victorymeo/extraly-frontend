import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// ====== CẤU HÌNH API ======
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('extra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ====== AUTH CONTEXT ======
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('extra_token');
    if (token) {
      api.get('/user/me')
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('extra_token'); setUser(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('extra_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };
  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('extra_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };
  const logout = () => { localStorage.removeItem('extra_token'); setUser(null); };
  const refreshBalance = async () => {
    const res = await api.get('/user/balance');
    setUser(prev => ({ ...prev, balance: res.data.balance }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshBalance, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within AuthProvider'); return ctx; }

// ====== MODAL ĐĂNG NHẬP / ĐĂNG KÝ ======
function AuthModal({ show, onClose }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) { await login(username, password); toast.success('Đăng nhập thành công'); }
      else { await register(username, email, password); toast.success('Đăng ký thành công'); }
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-8 rounded-xl w-96 border border-gray-700" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-yellow-400">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 my-2 rounded bg-gray-800 text-white border border-gray-600" required />
          {!isLogin && <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 my-2 rounded bg-gray-800 text-white border border-gray-600" required />}
          <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 my-2 rounded bg-gray-800 text-white border border-gray-600" required />
          <button type="submit" className="w-full bg-yellow-400 text-black font-bold py-2 rounded hover:bg-yellow-500">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <p className="text-gray-400 text-sm mt-3 text-center cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </p>
      </div>
    </div>
  );
}

// ====== LAYOUT (NAVBAR) ======
function Layout({ children }) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); toast.success('Đã đăng xuất'); };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* NAVBAR giống ảnh 2 */}
      <nav className="bg-gray-900 border-b border-gray-700 p-4 flex flex-wrap justify-between items-center sticky top-0 z-40">
        <Link to="/" className="text-2xl font-bold text-yellow-400">Extraly</Link>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-yellow-400">Trang chủ</Link>
          <Link to="/recharge" className="hover:text-yellow-400">Nạp tiền</Link>
          <Link to="/orders" className="hover:text-yellow-400">Đơn hàng</Link>
          <Link to="/history" className="hover:text-yellow-400">Lịch sử giao dịch</Link>
          <Link to="/services" className="hover:text-yellow-400">DỊCH VỤ</Link>
          <Link to="/product" className="hover:text-yellow-400">Đặt sản phẩm</Link>
          <Link to="/download" className="hover:text-yellow-400">Tải xuống</Link>
          <Link to="/contact" className="hover:text-yellow-400">Liên hệ</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-yellow-400 font-bold">💰 {user.balance?.toLocaleString() || 0}đ</span>
              <span className="text-gray-300">{user.username}</span>
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700">Đăng xuất</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-yellow-400 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500">Đăng nhập</button>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
      <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

// ====== TRANG CHỦ (GIỐNG ẢNH 2) ======
function Home() {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  
  useEffect(() => {
    if (user) {
      api.get('/order/my-orders').then(res => setOrderCount(res.data.orders?.length || 0)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Phần Số dư & Đơn hàng (giống ảnh 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 flex justify-between items-center">
          <span className="text-gray-400 font-medium">💰 Số dư</span>
          <span className="text-2xl font-bold text-yellow-400">{user?.balance?.toLocaleString() || 0}đ</span>
        </div>
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 flex justify-between items-center">
          <span className="text-gray-400 font-medium">📦 Đơn hàng</span>
          <span className="text-2xl font-bold text-yellow-400">{orderCount}</span>
        </div>
      </div>

      {/* Guest / Thành viên (giống ảnh 2) */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
        <span className="text-gray-400">{user ? 'Thành viên' : 'Guest'}</span>
        <span className="text-white font-medium">{user ? user.username : 'Khách'}</span>
      </div>

      {/* DỊCH VỤ HỖ TRỢ - Grid 2 cột giống ảnh 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. KEY PANEL */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">🔫 KEY PANEL EXTRALY</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Aimbot Safe/Head/Chest: Ghim đầu nhẹ, Ghim đầu chặt (RISK), Ghim cổ</li>
            <li>Định vị ESP Địch, Item vật phẩm trong sinh tồn</li>
            <li>Aim Mouse: Bán amm</li>
            <li>Aim FOV: Là tâm dịch</li>
          </ul>
        </div>

        {/* 2. GAME BOOSTER */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">⚡ EXTRALY GAME BOOSTER PC</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tối ưu RAM, giải phóng bộ nhớ đệm</li>
            <li>Tăng FPS game, giảm giật lag</li>
            <li>Dọn dẹp file rác, temp, cache</li>
            <li>Tính chính CPU/GPU cho hiệu năng cao nhất</li>
            <li>Tự động tối ưu khí khối động game</li>
          </ul>
        </div>

        {/* 3. NETCHEAT */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">🌐 NETCHEAT - THỦ THUẬT MẠNG</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Freeze: Đóng băng hành động dịch</li>
            <li>Teleport: Dịch chuyển tức thời</li>
            <li>Ghost: Bóng ma bí ẩn</li>
            <li>Tấn công mạng và can thiệp gói tin</li>
            <li>Fix drop FPS</li>
          </ul>
        </div>

        {/* 4. GÓI CẤU HÌNH ANDROID */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">📱 GÓI CẤU HÌNH MƯỢT ANDROID</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tư vấn cấu hình Android chơi game mượt</li>
            <li>Hướng dẫn tinh chỉnh đồ họa theo máy</li>
            <li>Tối ưu cảm ứng, gyroscope</li>
            <li>Giảm giật lag khi chơi game</li>
            <li>Fix drop FPS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ====== CÁC TRANG KHÁC ======
function Recharge() {
  const { user, refreshBalance } = useAuth();
  const [amount, setAmount] = useState(20000);
  const handleDeposit = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập');
    if (amount < 2000) return toast.error('Tối thiểu 2000đ');
    try {
      await api.post('/payment/deposit', { amount });
      toast.success('Nạp thành công');
      refreshBalance();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">💰 Nạp tiền</h2>
      <p className="text-gray-400">Số dư: <span className="text-white font-bold">{user?.balance?.toLocaleString() || 0}đ</span></p>
      <div className="flex flex-wrap gap-2 my-4">
        {[2000, 5000, 10000, 20000, 50000, 100000].map(a => (
          <button key={a} onClick={() => setAmount(a)} className={`px-4 py-2 rounded border ${amount === a ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-600'}`}>{a.toLocaleString()}đ</button>
        ))}
      </div>
      <button onClick={handleDeposit} className="bg-yellow-400 text-black px-6 py-2 rounded font-bold hover:bg-yellow-500">Nạp ngay</button>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/order/my-orders').then(res => setOrders(res.data.orders)).catch(() => {}); }, []);
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">📦 Đơn hàng của tôi</h2>
      {orders.length === 0 ? <p className="text-gray-400">Chưa có đơn hàng nào</p> : 
        orders.map(o => (
          <div key={o.id} className="border-b border-gray-700 py-2 flex flex-wrap justify-between">
            <span>{o.productName}</span>
            <span className="text-yellow-400">{o.price.toLocaleString()}đ</span>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded">{o.keyProvided}</span>
          </div>
        ))
      }
    </div>
  );
}

function History() {
  const [txs, setTxs] = useState([]);
  useEffect(() => { api.get('/payment/history').then(res => setTxs(res.data.transactions)).catch(() => {}); }, []);
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">📜 Lịch sử giao dịch</h2>
      {txs.length === 0 ? <p className="text-gray-400">Chưa có giao dịch</p> :
        txs.map(t => (
          <div key={t.id} className="border-b border-gray-700 py-1 flex justify-between">
            <span>{t.method}</span>
            <span className={t.type === 'deposit' ? 'text-green-400' : 'text-red-400'}>{t.amount.toLocaleString()}đ</span>
          </div>
        ))
      }
    </div>
  );
}

function Services() {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">🛠️ Dịch vụ</h2>
      <p className="text-gray-400">Xem chi tiết các gói dịch vụ tại trang chủ.</p>
    </div>
  );
}

function Product() {
  const { user, refreshBalance } = useAuth();
  const [product, setProduct] = useState({ name: 'Combo Xạ Trình', price: 340000 });
  const handleBuy = async () => {
    if (!user) return toast.error('Đăng nhập để mua');
    try {
      const res = await api.post('/order/create', { productName: product.name, productType: 'PC', price: product.price });
      toast.success(`Mua thành công! Key: ${res.data.key}`);
      refreshBalance();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">🛒 Đặt sản phẩm</h2>
      <div className="flex flex-wrap gap-3 my-3">
        <button onClick={() => setProduct({ name: 'Combo Aimtrang', price: 410000 })} className="border border-gray-600 px-4 py-2 rounded hover:border-yellow-400">Combo Aimtrang 410k</button>
        <button onClick={() => setProduct({ name: 'Combo Xạ Trình', price: 340000 })} className="border border-gray-600 px-4 py-2 rounded hover:border-yellow-400">Combo Xạ Trình 340k</button>
        <button onClick={() => setProduct({ name: 'Combo Thấu Thị', price: 210000 })} className="border border-gray-600 px-4 py-2 rounded hover:border-yellow-400">Combo Thấu Thị 210k</button>
      </div>
      <p className="text-yellow-400 font-bold">Tạm tính: {product.price.toLocaleString()}đ</p>
      <button onClick={handleBuy} className="mt-2 bg-yellow-400 text-black px-6 py-2 rounded font-bold hover:bg-yellow-500">Mua ngay</button>
    </div>
  );
}

function Download() {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">⬇️ Tải xuống</h2>
      <p className="text-gray-400">Các file tải về sẽ được cập nhật tại đây.</p>
    </div>
  );
}

function Contact() {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">📞 Liên hệ</h2>
      <p className="text-gray-400">Zalo: 0393399533 | Telegram: @extraly</p>
    </div>
  );
}

// ====== APP CHÍNH ======
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recharge" element={<Recharge />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/history" element={<History />} />
            <Route path="/services" element={<Services />} />
            <Route path="/product" element={<Product />} />
            <Route path="/download" element={<Download />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}