import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// ====== API ======
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(c => {
  const token = localStorage.getItem('extra_token');
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

// ====== AUTH ======
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

// ====== MODAL ĐĂNG NHẬP / ĐĂNG KÝ (SANG TRỌNG) ======
function AuthModal({ show, onClose }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) { await login(username, password); toast.success('Đăng nhập thành công'); }
      else { if (password !== confirm) return toast.error('Mật khẩu không khớp'); await register(username, email, password); toast.success('Đăng ký thành công'); }
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-[#1a2234] p-8 rounded-2xl w-96 border border-[#2a3a5c] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-[#f5c842] text-center mb-6">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 mb-3 rounded-lg bg-[#0f172a] text-white border border-[#2a3a5c] focus:border-[#f5c842] outline-none" required />
          {!isLogin && <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 mb-3 rounded-lg bg-[#0f172a] text-white border border-[#2a3a5c] focus:border-[#f5c842] outline-none" required />}
          <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mb-3 rounded-lg bg-[#0f172a] text-white border border-[#2a3a5c] focus:border-[#f5c842] outline-none" required />
          {!isLogin && <input type="password" placeholder="Xác nhận mật khẩu" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full p-3 mb-4 rounded-lg bg-[#0f172a] text-white border border-[#2a3a5c] focus:border-[#f5c842] outline-none" required />}
          <button type="submit" className="w-full bg-[#f5c842] text-[#0f172a] font-bold py-3 rounded-lg hover:bg-[#e0b030] transition">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center cursor-pointer hover:text-[#f5c842]" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </p>
      </div>
    </div>
  );
}

// ====== LAYOUT (NAVBAR SANG TRỌNG) ======
function Layout({ children }) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); toast.success('Đã đăng xuất'); };
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-gray-200">
      <nav className="bg-[#141c2b] border-b border-[#2a3a5c] p-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <Link to="/" className="text-3xl font-extrabold text-[#f5c842] tracking-wider">Extraly Store</Link>
          <div className="flex flex-wrap gap-5 text-sm font-medium">
            <Link to="/" className="hover:text-[#f5c842] transition">Trang chủ</Link>
            <Link to="/recharge" className="hover:text-[#f5c842] transition">Nạp tiền</Link>
            <Link to="/orders" className="hover:text-[#f5c842] transition">Đơn hàng</Link>
            <Link to="/history" className="hover:text-[#f5c842] transition">Lịch sử</Link>
            <Link to="/services" className="hover:text-[#f5c842] transition">DỊCH VỤ</Link>
            <Link to="/product" className="hover:text-[#f5c842] transition">Đặt sản phẩm</Link>
            <Link to="/download" className="hover:text-[#f5c842] transition">Tải xuống</Link>
            <Link to="/contact" className="hover:text-[#f5c842] transition">Liên hệ</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-[#f5c842] font-bold bg-[#0f172a] px-3 py-1 rounded-full border border-[#2a3a5c]">💰 {user.balance?.toLocaleString() || 0}đ</span>
                <span className="text-gray-300">{user.username}</span>
                <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-700 transition">Đăng xuất</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="bg-[#f5c842] text-[#0f172a] px-5 py-2 rounded-md font-bold hover:bg-[#e0b030] transition">Đăng nhập</button>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
      <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

// ====== TRANG CHỦ – GIỐNG HỆT GLORYVN ======
function Home() {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  useEffect(() => {
    if (user) api.get('/order/my-orders').then(res => setOrderCount(res.data.orders?.length || 0)).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Thông tin nổi bật */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] flex justify-between items-center">
          <span className="text-gray-400 font-medium">💰 Số dư</span>
          <span className="text-2xl font-bold text-[#f5c842]">{user?.balance?.toLocaleString() || 0}đ</span>
        </div>
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] flex justify-between items-center">
          <span className="text-gray-400 font-medium">📦 Đơn hàng</span>
          <span className="text-2xl font-bold text-[#f5c842]">{orderCount}</span>
        </div>
      </div>

      {/* Guest / Thành viên */}
      <div className="bg-[#141c2b] p-4 rounded-xl border border-[#2a3a5c] flex justify-between items-center">
        <span className="text-gray-400">{user ? 'Thành viên' : 'Guest'}</span>
        <span className="text-white font-medium">{user ? user.username : 'Khách'}</span>
      </div>

      {/* Các gói dịch vụ – GIỐNG ẢNH GLORYVN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GÓI NHÀ TẠY GAME ANDROID */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">📱 GÓI NHÀ TẠY GAME ANDROID</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Aim Drag: Kéo nhẹ là vào đầu</li>
            <li>✅ Hỗ trợ ghim tâm, bám sát mục tiêu</li>
            <li>✅ Tinh chỉnh cảm ứng, độ nhạy bản</li>
            <li>✅ Hỗ trợ gyroscope, tap fire nhanh</li>
            <li>✅ Tối ưu đồ họa, chống giật lag</li>
            <li>✅ Tăng FPS, ổn định khung hình</li>
            <li>✅ Tối ưu CPU/GPU/RAM khi chơi game</li>
            <li>✅ An toàn cho thiết bị 100%</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">375.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>

        {/* GÓI CAO CẤP IOS */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">🍎 GÓI CAO CẤP IOS</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Tối ưu trải nghiệm game trên iOS</li>
            <li>✅ Cải thiện tốc độ phản hồi, cảm ứng</li>
            <li>✅ Trải nghiệm game mượt mà, loại bỏ giật lag</li>
            <li>✅ Duy trì FPS ổn định</li>
            <li>✅ Tối ưu CPU/GPU/RAM</li>
            <li>✅ Hướng dẫn tùy chỉnh đồ họa</li>
            <li>✅ Cân bằng nhiệt độ thiết bị</li>
            <li>✅ Bảo vệ thiết bị an toàn tuyệt đối</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">375.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>

        {/* KEY PANEL EXTRALY (giống KEY PANEL GLORYVN) */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">🔫 KEY PANEL EXTRALY</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Aimbot Safe/Head/Chest: Ghim đầu nhẹ, Ghim đầu chặt (RISK), Ghim cổ</li>
            <li>✅ Định vị ESP Địch, Item vật phẩm trong sinh tồn</li>
            <li>✅ Aim Mouse: Bán amm</li>
            <li>✅ Aim FOV: Là tâm dịch</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">99.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>

        {/* EXTRALY GAME BOOSTER PC */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">⚡ EXTRALY GAME BOOSTER PC</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Tối ưu RAM, giải phóng bộ nhớ đệm</li>
            <li>✅ Tăng FPS game, giảm giật lag</li>
            <li>✅ Dọn dẹp file rác, temp, cache</li>
            <li>✅ Tính chính CPU/GPU cho hiệu năng cao nhất</li>
            <li>✅ Tự động tối ưu khi khởi động game</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">150.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>

        {/* NETCHEAT */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">🌐 NETCHEAT - THỦ THUẬT MẠNG</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Freeze: Đóng băng hành động dịch</li>
            <li>✅ Teleport: Dịch chuyển tức thời</li>
            <li>✅ Ghost: Bóng ma bí ẩn</li>
            <li>✅ Tấn công mạng và can thiệp gói tin</li>
            <li>✅ Fix drop FPS</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">120.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>

        {/* GÓI CẤU HÌNH MƯỢT ANDROID */}
        <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h3 className="text-xl font-bold text-[#f5c842] mb-3">📱 GÓI CẤU HÌNH MƯỢT ANDROID</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Tư vấn cấu hình Android chơi game mượt</li>
            <li>✅ Hướng dẫn tinh chỉnh đồ họa theo máy</li>
            <li>✅ Tối ưu cảm ứng, gyroscope</li>
            <li>✅ Giảm giật lag khi chơi game</li>
            <li>✅ Fix drop FPS</li>
          </ul>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-[#f5c842]">95.000đ</span>
            <button className="bg-[#f5c842] text-[#0f172a] px-4 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Mua ngay</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== CÁC TRANG KHÁC (giữ nguyên nhưng style đồng bộ) ======
function Recharge() {
  const { user, refreshBalance } = useAuth();
  const [amount, setAmount] = useState(20000);
  const [customAmount, setCustomAmount] = useState('');
  const handleDeposit = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập');
    const val = customAmount ? parseInt(customAmount) : amount;
    if (val < 2000) return toast.error('Tối thiểu 2.000đ');
    try { await api.post('/payment/deposit', { amount: val }); toast.success('Nạp thành công'); refreshBalance(); } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  const quickAmounts = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">💰 Nạp Tiền</h2>
      <p className="text-gray-400">Số dư hiện tại: <span className="text-white font-bold">{user?.balance?.toLocaleString() || 0}đ</span></p>
      <div className="mt-4">
        <p className="font-semibold">Chọn số tiền nạp</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map(a => (
            <button key={a} onClick={() => { setAmount(a); setCustomAmount(''); }} className={`px-4 py-2 rounded-lg border ${amount === a && !customAmount ? 'border-[#f5c842] bg-[#f5c842]/20' : 'border-[#2a3a5c]'} hover:border-[#f5c842] transition`}>{a.toLocaleString()}đ</button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input type="number" placeholder="Nhập số tiền tùy ý" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="bg-[#0f172a] border border-[#2a3a5c] rounded-lg p-2 w-48 text-white" />
          <span className="text-gray-400">VND (tối thiểu 2.000)</span>
        </div>
        <button onClick={handleDeposit} className="mt-4 bg-[#f5c842] text-[#0f172a] px-6 py-2 rounded-lg font-bold hover:bg-[#e0b030] transition">Nạp</button>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/order/my-orders').then(res => setOrders(res.data.orders)).catch(() => {}); }, []);
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">📦 Đơn hàng của tôi</h2>
      <p className="text-gray-400">Quản lý tất cả đơn hàng đã mua</p>
      {orders.length === 0 ? <p className="text-gray-400 mt-4">Chưa có đơn hàng nào.</p> :
        orders.map(o => (
          <div key={o.id} className="border-b border-[#2a3a5c] py-2 flex flex-wrap justify-between">
            <span>{o.productName}</span>
            <span className="text-[#f5c842]">{o.price.toLocaleString()}đ</span>
            <span className="text-xs bg-[#0f172a] px-2 py-1 rounded">{o.keyProvided}</span>
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
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">📜 Lịch sử giao dịch</h2>
      <p className="text-gray-400">Tất cả giao dịch nạp tiền và thanh toán</p>
      {txs.length === 0 ? <p className="text-gray-400 mt-4">Chưa có giao dịch nào.</p> :
        txs.map(t => (
          <div key={t.id} className="border-b border-[#2a3a5c] py-1 flex justify-between">
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
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">🛠️ DỊCH VỤ</h2>
      <p className="text-gray-400">Chi tiết các gói dịch vụ xem tại Trang chủ.</p>
    </div>
  );
}

function Product() {
  const { user, refreshBalance } = useAuth();
  const [product, setProduct] = useState({ name: 'Combo Dẫn Khóa', price: 410000 });
  const [platform, setPlatform] = useState('PC');
  const products = {
    'Combo Dẫn Khóa': { price: 410000, desc: 'Aimdrag + Assist Lock' },
    'Combo Xạ Trình': { price: 340000, desc: 'Aimbot Safe + Aimbot' },
    'Combo Thấu Thị': { price: 210000, desc: 'Esp Skeleton + Esp Name + Esp Health' },
    'Combo Siêu Tốc': { price: 250000, desc: 'Aim Range + Magnetic + TeleRun' }
  };
  const handleBuy = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập');
    try {
      const res = await api.post('/order/create', { productName: product.name, productType: platform, price: product.price });
      toast.success(`Mua thành công! Key: ${res.data.key}`);
      refreshBalance();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">🛒 Đặt sản phẩm</h2>
      <p className="text-gray-400">Chọn thiết bị và tính năng, hệ thống tự động tính giá</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Object.entries(products).map(([name, data]) => (
          <div key={name} onClick={() => setProduct({ name, price: data.price })} className={`border p-4 rounded-lg cursor-pointer hover:border-[#f5c842] ${product.name === name ? 'border-[#f5c842] bg-[#f5c842]/10' : 'border-[#2a3a5c]'}`}>
            <p className="font-bold">{name}</p>
            <p className="text-sm text-gray-400">{data.desc}</p>
            <p className="text-[#f5c842] font-bold">{data.price.toLocaleString()}₫</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 items-center">
        <span className="font-semibold">Cấu hình sản phẩm</span>
        {['PC', 'Android', 'iOS'].map(p => (
          <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-1 rounded-lg border ${platform === p ? 'border-[#f5c842] bg-[#f5c842]/20' : 'border-[#2a3a5c]'}`}>{p}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <p>Tạm tính: <span className="text-[#f5c842] font-bold">{product.price.toLocaleString()}đ</span></p>
        <p>Số dư: <span className="text-white font-bold">{user?.balance?.toLocaleString() || 0}đ</span></p>
        <button onClick={handleBuy} className="bg-[#f5c842] text-[#0f172a] font-bold px-6 py-2 rounded-lg hover:bg-[#e0b030] transition">Mua ngay</button>
      </div>
    </div>
  );
}

function Download() {
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">⬇️ Tải xuống</h2>
      <p className="text-gray-400">Các file tải về sẽ được cập nhật tại đây.</p>
    </div>
  );
}

function Contact() {
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">📞 Liên hệ</h2>
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