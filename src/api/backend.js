const API_URL = 'http://localhost:4000';
const BASE = process.env.REACT_APP_API_URL || API_URL;

// ---------- API Core ----------
export async function apiFetch(
  path,
  { method = 'GET', body, token } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => ({
    error: 'Server ไม่ได้ตอบกลับเป็น JSON',
  }));

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : data.error?.message || `Server ตอบกลับ ${res.status}`;

    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

// ---------- Authentication ----------
export function register(email, password, displayName) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
}

export function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function getMe(token) {
  return apiFetch('/api/me', { token });
}

// ---------- Genres ----------
export async function getGenres() {
  const data = await apiFetch('/api/genres');
  return data.items ?? data;
}

// ---------- Movies ----------
export async function getMovies() {
  const data = await apiFetch('/api/movies');
  return data.items ?? [];
}

export function getMovieById(movieId) {
  return apiFetch(`/api/movies/${movieId}`);
}

// ---------- Reviews ----------
export async function getReviews(movieId) {
  const data = await apiFetch(`/api/movies/${movieId}/reviews`);
  return data.items ?? [];
}

export function postReview(movieId, text, token) {
  return apiFetch(`/api/movies/${movieId}/reviews`, {
    method: 'POST',
    body: { text },
    token,
  });
}

// ---------- Votes ----------
export function putVote(movieId, score, token) {
  return apiFetch(`/api/movies/${movieId}/vote`, {
    method: 'PUT',
    body: { score },
    token,
  });
}

// ---------- Wishlist ----------
export async function getWishlist(token) {
  const data = await apiFetch('/api/me/wishlist', { token });
  return data.items ?? [];
}

export function addToWishlist(movieId, token) {
  return apiFetch(`/api/me/wishlist/${movieId}`, {
    method: 'PUT',
    token,
  });
}

export function removeFromWishlist(movieId, token) {
  return apiFetch(`/api/me/wishlist/${movieId}`, {
    method: 'DELETE',
    token,
  });
}

// ---------- Admin Dashboard ----------
export function getAdminStats(token) {
  return apiFetch('/api/admin/stats', { token });
}

// ---------- Admin Members ----------
export async function getAdminMembers(token) {
  const data = await apiFetch('/api/admin/members', { token });
  return data.items ?? [];
}

export function updateMemberRole(memberId, role, token) {
  return apiFetch(`/api/admin/members/${memberId}/role`, {
    method: 'PUT',
    body: { role },
    token,
  });
}

// ---------- Admin Movies ----------
export function getAdminMovie(movieId, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, { token });
}

export function createAdminMovie(movie, token) {
  return apiFetch('/api/admin/movies', {
    method: 'POST',
    body: movie,
    token,
  });
}

export function updateAdminMovie(movieId, movie, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, {
    method: 'PUT',
    body: movie,
    token,
  });
}

export function deleteAdminMovie(movieId, token) {
  return apiFetch(`/api/admin/movies/${movieId}`, {
    method: 'DELETE',
    token,
  });
}
