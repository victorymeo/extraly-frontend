// ====== TRANG CHỦ – CHUẨN GLORYVN ======
function Home() {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  useEffect(() => {
    if (user) api.get('/order/my-orders').then(res => setOrderCount(res.data.orders?.length || 0)).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Phần giới thiệu như ảnh GloryVN */}
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

      {/* DỊCH VỤ HỖ TRỢ - Tiêu đề */}
      <h3 className="text-xl font-bold text-[#f5c842] border-l-4 border-[#f5c842] pl-3">DỊCH VỤ HỖ TRỢ</h3>

      {/* Các khối dịch vụ - không có giá, chỉ mô tả */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. KEY PANEL */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">🔑 KEY PANEL EXTRALY</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Aimbot Safe/Head/Chest: Ghim đầu nhẹ, Ghim đầu chặt (RISK), Ghim cổ</li>
            <li>Định vị ESP Địch, Item vật phẩm trong sinh tồn</li>
            <li>Aim Mouse: Bán amm</li>
            <li>Aim FOV: Là tâm dịch</li>
            <li>Aim Silent: Đạn đuổi địch (RISK)</li>
          </ul>
        </div>

        {/* 2. GAME BOOSTER PC */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">⚡ EXTRALY GAME BOOSTER PC</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tối ưu RAM, giải phóng bộ nhớ đệm</li>
            <li>Tăng FPS game, giảm giật lag</li>
            <li>Dọn dẹp file rác, temp, cache</li>
            <li>Tính chính CPU/GPU cho hiệu năng cao nhất</li>
            <li>Tự động tối ưu khi khởi động game</li>
          </ul>
        </div>

        {/* 3. NETCHEAT */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">🌐 NETCHEAT - THỦ THUẬT MẠNG</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Freeze: Đóng băng hành động dịch</li>
            <li>Teleport: Dịch chuyển tức thời</li>
            <li>Ghost: Bóng ma bí ẩn</li>
            <li>Tấn công mạng và can thiệp gói tin</li>
            <li>Fix drop FPS</li>
          </ul>
        </div>

        {/* 4. GÓI CẤU HÌNH ANDROID */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a3a5c] hover:border-[#f5c842] transition">
          <h4 className="text-lg font-bold text-[#f5c842] mb-2">📱 GÓI CẤU HÌNH MƯỢT ANDROID</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
            <li>Tư vấn cấu hình Android chơi game mượt</li>
            <li>Hướng dẫn tinh chỉnh đồ họa theo máy</li>
            <li>Tối ưu cảm ứng, gyroscope</li>
            <li>Giảm giật lag khi chơi game</li>
            <li>Fix drop FPS</li>
          </ul>
        </div>
      </div>

      {/* Thông tin số dư & đơn hàng (vẫn giữ ở trên cùng hoặc dưới) – tôi sẽ đưa lên trên cùng như ảnh */}
      {/* Nhưng trong ảnh GloryVN không có phần này ở trang chủ, nó có ở header, nên tôi bỏ đi để giống ảnh hơn */}
      {/* Tuy nhiên để tiện dụng, tôi sẽ để ở dưới dạng thông tin nhanh nhưng nhẹ nhàng */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-[#141c2b] p-3 rounded-xl border border-[#2a3a5c] flex justify-between">
          <span className="text-gray-400 text-sm">💰 Số dư</span>
          <span className="text-[#f5c842] font-bold">{user?.balance?.toLocaleString() || 0}đ</span>
        </div>
        <div className="bg-[#141c2b] p-3 rounded-xl border border-[#2a3a5c] flex justify-between">
          <span className="text-gray-400 text-sm">📦 Đơn hàng</span>
          <span className="text-[#f5c842] font-bold">{orderCount}</span>
        </div>
      </div>
    </div>
  );
}