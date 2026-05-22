import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers, createUser, updateUser, updateUserStatus, deleteUser, reset } from '../../features/admin/adminUserSlice';
import { Search, UserPlus, Pencil, Trash2, UserX, UserCheck, CircleCheck, CircleX, X, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ── Role Badge ── */
const RoleBadge = ({ role }) => {
    const map = {
        admin:    'badge badge-danger',
        landlord: 'badge badge-info',
        tenant:   'badge badge-muted',
    };
    const label = { admin: 'Quản trị', landlord: 'Chủ trọ', tenant: 'Thành viên' };
    return <span className={map[role] || 'badge badge-muted'}>{label[role] || role}</span>;
};

/* ── Status Badge ── */
const StatusDot = ({ status }) => (
    <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-danger'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {status === 'active' ? 'Hoạt động' : 'Bị chặn'}
    </span>
);

/* ── Form Field ── */
const Field = ({ label, hint, children }) => (
    <div>
        <label className="input-label">{label} {hint && <span className="normal-case font-medium text-gray-400">{hint}</span>}</label>
        {children}
    </div>
);

const UserManagement = () => {
    const dispatch = useDispatch();
    const { users, isLoading, isError, message } = useSelector(s => s.adminUsers);

    const [filters, setFilters] = useState({ search: '', role: '', status: '', is_verified: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selUser, setSelUser] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phoneNumber: '', role: 'tenant', status: 'active' });

    useEffect(() => { dispatch(getAllUsers(filters)); }, [dispatch, filters]);
    useEffect(() => { if (isError) { toast.error(message); dispatch(reset()); } }, [isError, message, dispatch]);

    const onFilter = e => setFilters({ ...filters, [e.target.name]: e.target.value });
    const onInput = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const closeModal = () => { setShowCreate(false); setShowEdit(false); setSelUser(null); };

    const handleCreate = e => {
        e.preventDefault();
        dispatch(createUser(formData)).then(res => {
            if (!res.error) {
                toast.success('Đã tạo người dùng mới');
                closeModal();
                setFormData({ fullName: '', email: '', password: '', phoneNumber: '', role: 'tenant', status: 'active' });
                dispatch(getAllUsers(filters));
            }
        });
    };

    const handleEdit = e => {
        e.preventDefault();
        const data = { ...formData };
        if (!data.password) delete data.password;
        dispatch(updateUser({ id: selUser.user_id, userData: data })).then(res => {
            if (!res.error) { toast.success('Cập nhật thành công'); closeModal(); dispatch(getAllUsers(filters)); }
        });
    };

    const openEdit = (u) => {
        setSelUser(u);
        setFormData({ fullName: u.full_name || '', email: u.email || '', password: '', phoneNumber: u.phone_number || '', role: u.role || 'tenant', status: u.status || 'active' });
        setShowEdit(true);
    };

    const toggleStatus = u => {
        const ns = u.status === 'active' ? 'blocked' : 'active';
        dispatch(updateUserStatus({ id: u.user_id, status: ns })).then(res => {
            if (!res.error) toast.success(`${ns === 'blocked' ? 'Đã chặn' : 'Đã mở chặn'} tài khoản`);
        });
    };

    const handleDelete = id => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-bold">Xóa vĩnh viễn người dùng này?</p>
                <div className="flex gap-2">
                    <button onClick={() => { dispatch(deleteUser(id)).then(r => { if (!r.error) toast.success('Đã xóa'); }); toast.dismiss(t.id); }}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded">Xóa</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 border text-xs font-black rounded">Hủy</button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    const selectCls = "border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-600 focus:outline-none focus:border-black transition-colors rounded";

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="section-divider flex items-end justify-between">
                <div>
                    <p className="section-label mb-2">Quản trị</p>
                    <h1 className="page-title">Quản lý Users</h1>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-danger">
                    <UserPlus size={15} /> Thêm người dùng
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="card-base p-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="search" value={filters.search} onChange={onFilter}
                        placeholder="Tìm theo tên, email, SĐT..."
                        className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-gray-200 focus:outline-none focus:border-black transition-colors bg-white" />
                </div>
                <select name="role" value={filters.role} onChange={onFilter} className={selectCls}>
                    <option value="">Tất cả vai trò</option>
                    <option value="tenant">Người thuê</option>
                    <option value="landlord">Chủ trọ</option>
                    <option value="admin">Admin</option>
                </select>
                <select name="status" value={filters.status} onChange={onFilter} className={selectCls}>
                    <option value="">Trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="blocked">Bị chặn</option>
                </select>
                <select name="is_verified" value={filters.is_verified} onChange={onFilter} className={selectCls}>
                    <option value="">Xác minh</option>
                    <option value="true">Đã xác minh</option>
                    <option value="false">Chưa xác minh</option>
                </select>
                <span className="section-label ml-auto">{users.length} người dùng</span>
            </div>

            {/* ── Table ── */}
            <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Người dùng</th>
                                <th className="table-header">Liên lạc</th>
                                <th className="table-header">Vai trò</th>
                                <th className="table-header">Xác minh</th>
                                <th className="table-header">Trạng thái</th>
                                <th className="table-header text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="py-16 text-center"><Loader size={20} className="animate-spin text-gray-300 mx-auto" /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="6" className="py-16 text-center"><p className="empty-state-text">Không tìm thấy người dùng</p></td></tr>
                            ) : users.map(u => (
                                <tr key={u.user_id} className="table-row group">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 overflow-hidden flex-shrink-0 bg-gray-100">
                                                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=f3f4f6&color=4b5563`}
                                                    alt="avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-black leading-none mb-0.5">{u.full_name}</p>
                                                <p className="meta-text text-gray-400">#{u.user_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <p className="text-sm font-medium text-gray-700">{u.email}</p>
                                        <p className="meta-text text-gray-400">{u.phone_number || '—'}</p>
                                    </td>
                                    <td className="table-cell"><RoleBadge role={u.role} /></td>
                                    <td className="table-cell">
                                        {u.is_verified
                                            ? <CircleCheck size={16} className="text-emerald-500" />
                                            : <CircleX size={16} className="text-gray-300" />}
                                    </td>
                                    <td className="table-cell"><StatusDot status={u.status} /></td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(u)} title="Sửa" className="p-2 border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-all">
                                                <Pencil size={13} />
                                            </button>
                                            <button onClick={() => toggleStatus(u)} title={u.status === 'active' ? 'Chặn' : 'Mở chặn'}
                                                className={`p-2 border border-gray-200 transition-all ${u.status === 'active' ? 'text-amber-500 hover:border-amber-400' : 'text-emerald-500 hover:border-emerald-400'}`}>
                                                {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                                            </button>
                                            <button onClick={() => handleDelete(u.user_id)} title="Xóa" className="p-2 border border-gray-200 text-red-500 hover:border-red-400 transition-all">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Create/Edit ── */}
            {(showCreate || showEdit) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <p className="section-label mb-1">{showCreate ? 'Mới' : 'Chỉnh sửa'}</p>
                                <h2 className="text-lg font-bold text-black tracking-tight">
                                    {showCreate ? 'Tạo người dùng mới' : `Cập nhật: ${selUser?.full_name}`}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={showCreate ? handleCreate : handleEdit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Họ và tên">
                                    <input type="text" name="fullName" value={formData.fullName} onChange={onInput} required className="input-minimal" placeholder="Nguyễn Văn A" />
                                </Field>
                                <Field label="Điện thoại">
                                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={onInput} required className="input-minimal" placeholder="09xx..." />
                                </Field>
                            </div>

                            <Field label="Email">
                                <input type="email" name="email" value={formData.email} onChange={onInput} required className="input-minimal" placeholder="user@smartprop.com" autoComplete="off" />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Mật khẩu" hint={showEdit ? '(để trống nếu không đổi)' : ''}>
                                    <input type="password" name="password" value={formData.password} onChange={onInput} required={showCreate}
                                        className="input-minimal" placeholder="••••••••" autoComplete="new-password" />
                                </Field>
                                <Field label="Vai trò">
                                    <select name="role" value={formData.role} onChange={onInput} className="input-minimal">
                                        <option value="tenant">Người thuê</option>
                                        <option value="landlord">Chủ trọ</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </Field>
                            </div>

                            {showEdit && (
                                <Field label="Trạng thái">
                                    <select name="status" value={formData.status} onChange={onInput} className="input-minimal">
                                        <option value="active">Hoạt động</option>
                                        <option value="blocked">Bị chặn</option>
                                    </select>
                                </Field>
                            )}

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="btn-ghost flex-1 justify-center">Hủy</button>
                                <button type="submit" className="btn-primary flex-1 justify-center">
                                    {showCreate ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
