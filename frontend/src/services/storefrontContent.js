import api from './api';

let contentPromise;

export const getStorefrontContent = () => {
  if (contentPromise) return contentPromise;

  const request = api.get('/shopify/content')
    .then((response) => response.data?.data || { announcement: null, banners: [], concerns: [] })
    .catch(() => ({ announcement: null, banners: [], concerns: [] }));

  contentPromise = request;
  request.then(() => {
    if (contentPromise === request) contentPromise = null;
  });

  return request;
};
