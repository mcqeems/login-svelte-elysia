<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, type User } from '#lib/api.ts';

	let user = $state<User | null>(null);
	let loading = $state(true);
	let loggingOut = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			const data = await apiFetch<{ user: User }>('/auth/me');
			user = data.user;
		} catch {
			user = null;
		} finally {
			loading = false;
		}
	});

	async function handleLogout() {
		loggingOut = true;
		error = '';
		try {
			await apiFetch('/auth/logout', { method: 'POST' });
			user = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Logout failed.';
		} finally {
			loggingOut = false;
		}
	}
</script>

<section class="card">
	{#if loading}
		<h1>Account</h1>
		<p class="meta">Checking session...</p>
	{:else if user}
		<h1>Welcome, {user.name}</h1>
		<p class="meta">Signed in as {user.email}</p>
		{#if error}
			<div class="alert" role="alert">{error}</div>
		{/if}
		<button type="button" class="btn-secondary" disabled={loggingOut} onclick={handleLogout}>
			{loggingOut ? 'Logging out...' : 'Log out'}
		</button>
	{:else}
		<h1>Welcome</h1>
		<p class="meta">Sign in to your account or register a new one.</p>
		<div class="actions">
			<a class="btn-primary" href="/login">Sign in</a>
			<a class="btn-secondary" href="/register">Create account</a>
		</div>
	{/if}
</section>
