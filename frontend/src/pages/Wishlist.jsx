import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import Rating from '../components/common/Rating';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart }             = useCart();

  const moveToCart = async (product) => {
    try {
      await addToCart(product);
      toggleWishlist(product);
      toast.success(`${product.name} moved to cart`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not move item to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-site mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center mx-auto mb-6">
          <Heart size={32} className="text-muted" />
        </div>
        <h2 className="font-display text-3xl font-semibold text-charcoal mb-3">Your wishlist is empty</h2>
        <p className="text-muted mb-8 max-w-xs mx-auto">Save your favourite products here and revisit them anytime.</p>
        <Link to="/products" className="btn-primary inline-flex">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-site mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">My Wishlist</h1>
          <p className="text-sm text-muted mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((product) => (
          <div key={product.id} className="product-card group relative">
            {/* Remove */}
            <button
              onClick={() => { toggleWishlist(product); toast.success('Removed from wishlist'); }}
              aria-label="Remove from wishlist"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center
                text-accent hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>

            {/* Image */}
            <Link to={`/products/${product.id}`}>
              <div className="aspect-[3/4] bg-ivory-dark overflow-hidden">
                <img
                  src={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>

            <div className="card-gold-line" />

            <div className="p-4">
              <p className="text-[11px] text-muted font-medium tracking-widest uppercase mb-1">{product.brand || 'Lumière'}</p>
              <Link to={`/products/${product.id}`}>
                <h3 className="font-semibold text-sm text-charcoal hover:text-accent transition-colors line-clamp-1 mb-1">
                  {product.name}
                </h3>
              </Link>
              <Rating value={product.rating} count={product.reviewCount} size={12} />
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-charcoal text-sm">₹{product.price?.toLocaleString()}</span>
                <button
                  onClick={() => moveToCart(product)}
                  disabled={product.comingSoon}
                  className="flex items-center gap-1.5 text-xs font-semibold text-charcoal bg-ivory-dark
                    hover:bg-charcoal hover:text-ivory px-3 py-1.5 rounded-pill transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingBag size={13} /> {product.comingSoon ? 'Coming Soon' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
