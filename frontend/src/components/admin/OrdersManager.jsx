import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { REGION_OPTIONS } from '../../utils/constants';

const STATUSES = ['ordered', 'confirmed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'];
const labelize = (value) => String(value || '').replace(/(^|-)\w/g, (letter) => letter.toUpperCase());

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
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

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">Orders by region</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and update orders based on the customer delivery region.</p></div>
        <button type="button" onClick={loadOrders} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"><RefreshCcw size={15} /> Refresh</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <select value={region} onChange={(event) => setRegion(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950">
          <option value="">All regions</option>{REGION_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950">
          <option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}
        </select>
      </div>
      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 dark:border-white/10">
        {loading ? <p className="p-8 text-sm text-slate-500">Loading orders...</p> : orders.length === 0 ? <p className="p-8 text-sm text-slate-500">No orders match these filters.</p> : (
          <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">{orders.map((order) => <tr key={order.id}><td className="px-4 py-4 font-medium text-slate-900 dark:text-white"><div>#{order.id.slice(-6).toUpperCase()}</div><div className="mt-1 text-xs font-normal text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div></td><td className="px-4 py-4"><div className="font-medium text-slate-800 dark:text-slate-200">{order.user?.name || order.shippingAddress?.name}</div><div className="mt-1 text-xs text-slate-500">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div></td><td className="px-4 py-4"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">{labelize(order.deliveryRegion || 'unknown')}</span></td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td><td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}</td><td className="px-4 py-4"><select disabled={updatingId === order.id} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize dark:border-white/10 dark:bg-slate-950">{STATUSES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></td></tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
