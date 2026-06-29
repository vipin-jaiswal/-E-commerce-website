import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const sortProducts = (items = [], sort = 'newest') => {
  const list = [...items];

  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    case 'price_desc':
      return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    case 'rating':
      return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    case 'best_seller':
      return list.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    case 'newest':
    default:
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

const normalizeList = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizeItem = (payload) => {
  const data = payload?.data ?? payload;
  if (data?.id) return data;
  if (data?.data?.id) return data.data;
  return null;
};

export function useProducts(params = {}) {
  const query = useMemo(() => {
    const next = {};
    if (params.q) next.keyword = params.q;
    if (params.keyword) next.keyword = params.keyword;
    if (params.category) next.category = params.category;
    if (params.page) next.page = params.page;
    if (params.limit) next.limit = params.limit;
    return next;
  }, [params.q, params.keyword, params.category, params.page, params.limit]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/products', { params: query });
        const list = normalizeList(response);
        const sorted = sortProducts(list, params.sort);

        if (!alive) return;
        setProducts(sorted);
        setTotal(Number(response?.data?.total ?? list.length ?? 0));
        setPages(Number(response?.data?.pages ?? 0));
      } catch (err) {
        if (!alive) return;
        setError(err);
        setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [query, params.sort]);

  return { products, loading, error, total, pages };
}

export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/products/${id}`);
        if (!alive) return;
        setProduct(normalizeItem(response));
      } catch (err) {
        if (!alive) return;
        setError(err);
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  return { product, loading, error };
}
