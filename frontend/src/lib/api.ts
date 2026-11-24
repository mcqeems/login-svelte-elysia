const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type User = {
	id: number;
	name: string;
	email: string;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body !== undefined && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const res = await fetch(`${API_URL}${path}`, {
		...init,
		credentials: 'include',
		headers
	});

	const data = (await res.json().catch(() => ({}))) as T & { error?: string };
	if (!res.ok) {
		throw new Error(data.error ?? `Request failed (${res.status})`);
	}

	return data;
}
