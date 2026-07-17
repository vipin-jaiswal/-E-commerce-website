import { useEffect, useState } from 'react';
import { MapPin, Phone, RefreshCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { REGION_OPTIONS } from '../../utils/constants';

const STATUSES = ['ordered', 'confirmed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'];
const labelize = (value) => String(value || '').replace(/(^|-)\w/g, (letter) => letter.toUpperCase());

function DeliveryAddress({ address }) {
  if (!address) return <span className="text-xs text-slate-400">Address unavailable</span>;

  const locality = [address.city, address.state, address.zip].filter(Boolean).join(', ');

  return (
    <div className="min-w-56 text-xs leading-5 text-slate-600 dark:text-slate-300">
      <div className="font-medium text-slate-800 dark:text-slate-100">{address.name || 'Customer'}</div>
      {address.street && <div>{address.street}</div>}
      {locality && <div>{locality}</div>}
      {address.country && <div>{address.country}</div>}
      {address.phone && (
        <a href={`tel:${address.phone}`} className="mt-1 inline-flex items-center gap-1 text-pink-600 hover:underline dark:text-pink-300">
          <Phone size={12} aria-hidden="true" /> {address.phone}
        </a>
      )}
    </div>
  );
}

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [orderIdQuery, setOrderIdQuery] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try { setOrders(await adminService.listOrders({ ...(region ? { region } : {}), ...(status ? { status } : {}) })); }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [region, status]);

  const updateStatus = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      const updated = await adminService.updateOrderStatus(id, nextStatus);
      setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
      toast.success('Order status updated');
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to update order'); }
    finally { setUpdatingId(''); }
  };

  const matchingOrders = orders.filter((order) =>
    String(order.id || '').toLowerCase().includes(orderIdQuery.trim().replace(/^#/, '').toLowerCase())
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-slate-900">
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto] xl:items-center">

    {/* Search */}
    <label className="relative">
      <span className="sr-only">Search by Order ID</span>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        type="text"
        value={orderIdQuery}
        onChange={(e) => setOrderIdQuery(e.target.value)}
        placeholder="Search by Order ID..."
        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-pink-500/20"
      />
    </label>

    {/* Region */}
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-pink-500/20"
    >
      <option value="">All Regions</option>
      {REGION_OPTIONS.map((item) => (
        <option key={item.key} value={item.key}>
          {item.label}
        </option>
      ))}
    </select>

    {/* Status */}
    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-pink-500/20"
    >
      <option value="">All Statuses</option>
      {STATUSES.map((item) => (
        <option key={item} value={item}>
          {labelize(item)}
        </option>
      ))}
    </select>

    {/* Refresh Button */}
    <button
      type="button"
      onClick={loadOrders}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 active:scale-95"
    >
      <RefreshCcw size={16} />
      Refresh
    </button>

  </div>
</div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
        {loading ? <p className="p-8 text-sm text-slate-500">Loading orders...</p> : matchingOrders.length === 0 ? <p className="p-8 text-sm text-slate-500">No orders match these filters.</p> : (
          <table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Delivery address</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">{matchingOrders.map((order) => <tr key={order.id}><td className="px-4 py-4 font-medium text-slate-900 dark:text-white"><div>#{order.id.slice(-6).toUpperCase()}</div><div className="mt-1 text-xs font-normal text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div></td><td className="px-4 py-4"><div className="font-medium text-slate-800 dark:text-slate-200">{order.user?.name || order.shippingAddress?.name}</div><div className="mt-1 text-xs text-slate-500">{order.user?.email || 'No email available'}</div></td><td className="px-4 py-4"><div className="flex items-start gap-2"><MapPin className="mt-0.5 shrink-0 text-pink-500" size={15} aria-hidden="true" /><DeliveryAddress address={order.shippingAddress} /></div></td><td className="px-4 py-4"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">{labelize(order.deliveryRegion || 'unknown')}</span></td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td><td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}</td><td className="px-4 py-4"><select disabled={updatingId === order.id} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize dark:border-white/10 dark:bg-slate-950">{STATUSES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></td></tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
