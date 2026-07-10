import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const normalizeList = (payload) => {
  const data = payload?.data ?? payload;
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list.map((item) => ({
    ...item,
    id: item.id || item._id,
  }));
};

const normalizeItem = (payload) => {
  const data = payload?.data ?? payload;
  if (data?.id || data?._id) return { ...data, id: data.id || data._id };
  if (data?.data?.id || data?.data?._id) {
    return { ...data.data, id: data.data.id || data.data._id };
  }
  return null;
};

export function useProducts(params = {}) {
  const query = useMemo(() => {
    const next = {};
    if (params.q) next.keyword = params.q;
    if (params.keyword) next.keyword = params.keyword;
    if (params.category) next.category = params.category;
    if (params.page) next.page = params.page;
    if (params.limit !== undefined && params.limit !== null) next.limit = params.limit;
    if (params.bestSeller) next.bestSeller = params.bestSeller;
    if (params.sort) next.sort = params.sort;
    return next;
  }, [params.q, params.keyword, params.category, params.page, params.limit, params.bestSeller, params.sort]);

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

        if (!alive) return;
        setProducts(list);
        setTotal(Number(response?.data?.total ?? list.length ?? 0));
        setPages(Number(response?.data?.pages ?? 0));
      } catch (err) {
        if (!alive) return;
        setError(err);
        setProducts([]);
        setTotal(0);
        setPages(0);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [query]);

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
