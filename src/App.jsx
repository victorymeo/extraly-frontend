import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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

// ====== MODAL ĐĂNG NHẬP / ĐĂNG KÝ ======
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

// ====== LAYOUT CHÍNH (SIDEBAR + CONTENT) ======
function Layout({ children }) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/'); toast.success('Đã đăng xuất'); };

  const menuItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Nạp tiền', path: '/recharge' },
    { name: 'Đơn hàng', path: '/orders' },
    { name: 'Lịch sử giao dịch', path: '/history' },
    { name: 'DỊCH VỤ', path: '/services' },
    { name: 'Đặt sản phẩm', path: '/product' },
    { name: 'Tải xuống', path: '/download' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0f1a] text-gray-200">
      {/* SIDEBAR - bên trái */}
      <div className="w-64 bg-[#141c2b] border-r border-[#2a3a5c] h-screen sticky top-0 flex flex-col shrink-0">
        <div className="p-5 border-b border-[#2a3a5c]">
          <div className="text-2xl font-extrabold text-[#f5c842] text-center">Extraly Store</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#f5c842] text-[#0b0f1a]'
                    : 'text-gray-300 hover:bg-[#2a3a5c] hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#2a3a5c]">
          {user ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">💰 Số dư</span>
                <span className="text-[#f5c842] font-bold">{user.balance?.toLocaleString() || 0}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">👤 {user.username}</span>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="w-full bg-[#f5c842] text-[#0b0f1a] font-bold py-2 rounded-lg hover:bg-[#e0b030] transition">
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* CONTENT - bên phải */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header thông tin nhanh (Số dư & Đơn hàng) - giống ảnh */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#141c2b] p-3 rounded-xl border border-[#2a3a5c] flex justify-between items-center">
            <span className="text-gray-400 text-sm">💰 Số dư</span>
            <span className="text-[#f5c842] font-bold text-lg">{user?.balance?.toLocaleString() || 0}đ</span>
          </div>
          <div className="bg-[#141c2b] p-3 rounded-xl border border-[#2a3a5c] flex justify-between items-center">
            <span className="text-gray-400 text-sm">📦 Đơn hàng</span>
            <span className="text-[#f5c842] font-bold text-lg">0</span> {/* Tạm thời, sẽ lấy từ API sau */}
          </div>
        </div>
        {children}
      </div>

      <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

// ====== TRANG CHỦ ======
function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-[#f5c842]">EXTRALY STORE</h2>
          <span className="text-gray-400 text-sm">28/7/2026</span>
        </div>
        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
          <li>Extraly Store - Hệ thống dịch vụ hỗ trợ chơi game uy tín chất lượng.</li>
          <li>Chúng tôi cung cấp các giải pháp hỗ trợ kỹ thuật, tối ưu hệ thống và tư vấn cấu hình game.</li>
          <li>Hoàn toàn không cần thiết vào game, đảm bảo an toàn cho tài khoản và thiết bị của bạn.</li>
          <li>Mọi vấn đề cần hỗ trợ, liên hệ Admin qua trang Liên Hệ.</li>
        </ul>
      </div>
      <h3 className="text-xl font-bold text-[#f5c842] border-l-4 border-[#f5c842] pl-3">DỊCH VỤ HỖ TRỢ</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c]">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">🔑 KEY PANEL EXTRALY</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Aimbot Safe/Head/Chest: Ghim đầu nhẹ, Ghim đầu chặt (RISK), Ghim cổ</li>
            <li>Định vị ESP Địch, Item vật phẩm trong sinh tồn</li>
            <li>Aim Mouse: Bán amm</li>
            <li>Aim FOV: Là tâm dịch</li>
          </ul>
        </div>
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c]">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">⚡ EXTRALY GAME BOOSTER PC</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tối ưu RAM, giải phóng bộ nhớ đệm</li>
            <li>Tăng FPS game, giảm giật lag</li>
            <li>Dọn dẹp file rác, temp, cache</li>
            <li>Tính chính CPU/GPU cho hiệu năng cao nhất</li>
          </ul>
        </div>
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c]">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">🌐 NETCHEAT - THỦ THUẬT MẠNG</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Freeze: Đóng băng hành động dịch</li>
            <li>Teleport: Dịch chuyển tức thời</li>
            <li>Ghost: Bóng ma bí ẩn</li>
            <li>Tấn công mạng và can thiệp gói tin</li>
          </ul>
        </div>
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c]">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">📱 GÓI CẤU HÌNH MƯỢT ANDROID</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tư vấn cấu hình Android chơi game mượt</li>
            <li>Hướng dẫn tinh chỉnh đồ họa theo máy</li>
            <li>Tối ưu cảm ứng, gyroscope</li>
            <li>Giảm giật lag khi chơi game</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ====== NẠP TIỀN ======
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

// ====== ĐƠN HÀNG ======
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

// ====== LỊCH SỬ ======
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

// ====== DỊCH VỤ (Giống ảnh: hiển thị các mục "CỘ BẢN", "Tùy chỉnh", v.v...) ======
function Services() {
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842] mb-4">🛠️ DỊCH VỤ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white border-b border-[#2a3a5c] pb-2 mb-3">CỘ BẢN</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Hỗ trợ kéo tâm</li>
            <li>✅ Chỉnh độ nhạy</li>
            <li>✅ Aimbot Safe</li>
            <li>✅ Spin Assist</li>
            <li>✅ Recoil Control</li>
            <li>✅ ESP Visuals</li>
            <li>✅ ESP Box</li>
            <li>✅ ESP Name</li>
            <li>✅ ESP Cornered Box</li>
            <li>✅ ESP Fill Box Glow</li>
            <li>✅ Magnetic</li>
            <li>✅ PARTICLE EFFECTS - Sakura</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white border-b border-[#2a3a5c] pb-2 mb-3">TÙY CHỈNH</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>✅ Định vị</li>
            <li>✅ Tối ưu thiết bị</li>
            <li>✅ Aimbot</li>
            <li>✅ Aimbot Safe</li>
            <li>✅ Spin Assist</li>
            <li>✅ Recoil Control</li>
            <li>✅ ESP Visuals</li>
            <li>✅ ESP Box</li>
            <li>✅ ESP Name</li>
            <li>✅ ESP Cornered Box</li>
            <li>✅ ESP Fill Box Glow</li>
            <li>✅ Magnetic</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ====== ĐẶT SẢN PHẨM (GIỐNG ẢNH 2: CÓ COMBO, GIÁ, CẤU HÌNH) ======
function Product() {
  const { user, refreshBalance } = useAuth();
  const [product, setProduct] = useState({ name: 'Combo Dẫn Khóa', price: 410000 });
  const [platform, setPlatform] = useState('PC');

  const productList = [
    { name: 'Combo Dẫn Khóa', price: 410000, desc: 'Aimbag + Assist Lock' },
    { name: 'Combo Ẩn Trì', price: 510000, desc: 'Aimbot Delay + Assist Lock' },
    { name: 'Combo Siêu Tốc', price: 410000, desc: 'Aim Range + Magnetic + TeleRun' },
  ];

  const handleBuy = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập');
    try {
      const res = await api.post('/order/create', {
        productName: product.name,
        productType: platform,
        price: product.price
      });
      toast.success(`Mua thành công! Key: ${res.data.key}`);
      refreshBalance();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">🛒 Đặt sản phẩm</h2>
      <p className="text-gray-400">Chọn thiết bị và tính năng bạn muốn, hệ thống sẽ tự động tính giá</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {productList.map((p) => (
          <div 
            key={p.name} 
            onClick={() => setProduct(p)} 
            className={`border p-4 rounded-xl cursor-pointer transition hover:border-[#f5c842] ${
              product.name === p.name ? 'border-[#f5c842] bg-[#f5c842]/10' : 'border-[#2a3a5c]'
            }`}
          >
            <p className="font-bold text-white">{p.name}</p>
            <p className="text-sm text-gray-400">{p.desc}</p>
            <p className="text-[#f5c842] font-bold text-lg mt-2">{p.price.toLocaleString()}đ</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 items-center border-t border-[#2a3a5c] pt-4">
        <span className="font-semibold">Cấu hình sản phẩm</span>
        {['PC', 'Android', 'iOS'].map(p => (
          <button 
            key={p} 
            onClick={() => setPlatform(p)} 
            className={`px-4 py-1 rounded-lg border ${
              platform === p ? 'border-[#f5c842] bg-[#f5c842]/20' : 'border-[#2a3a5c]'
            } hover:border-[#f5c842] transition`}
          >
            {p}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">PC Windows</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6 bg-[#0f172a] p-4 rounded-lg">
        <p>Tạm tính: <span className="text-[#f5c842] font-bold text-xl">{product.price.toLocaleString()}đ</span></p>
        <p>Số dư: <span className="text-white font-bold">{user?.balance?.toLocaleString() || 0}đ</span></p>
        <button 
          onClick={handleBuy} 
          className="bg-[#f5c842] text-[#0f172a] font-bold px-8 py-2 rounded-lg hover:bg-[#e0b030] transition ml-auto"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}

// ====== TẢI XUỐNG ======
function Download() {
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">⬇️ Tải xuống</h2>
      <p className="text-gray-400">Các file tải về sẽ được cập nhật tại đây.</p>
    </div>
  );
}

// ====== LIÊN HỆ ======
function Contact() {
  return (
    <div className="bg-[#141c2b] p-6 rounded-xl border border-[#2a3a5c]">
      <h2 className="text-2xl font-bold text-[#f5c842]">📞 Liên hệ</h2>
      <div className="mt-4 space-y-2">
        <p className="text-gray-300">📱 Zalo Cá Nhân: 0393399533</p>
        <p className="text-gray-300">📱 Zalo Cộng Đồng: Tham gia nhóm</p>
        <p className="text-gray-300">✈️ Telegram: @extraly</p>
        <p className="text-gray-400 text-sm mt-4">Hỗ trợ 8:00 – 23:00 hằng ngày. Ngoài giờ vui lòng để lại tin nhắn.</p>
      </div>
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