<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiFetch, type User } from '#lib/api.ts';
	import { syncInvalidAria } from '#lib/formAria.ts';
	import PasswordInput from '#lib/PasswordInput.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		submitting = true;

		try {
			await apiFetch<{ user: User }>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed.';
		} finally {
			submitting = false;
		}
	}
</script>

<section class="card">
	<h1>Sign in</h1>

	{#if error}
		<div class="alert" role="alert">{error}</div>
	{/if}

	<form method="POST" onsubmit={handleSubmit}>
		<div class="field">
			<label for="email">Email</label>
			<span id="email-hint" class="hint">Format: you@example.com</span>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="username"
				spellcheck="false"
				enterkeyhint="next"
				required
				aria-describedby="email-hint"
				data-error="email-error"
				bind:value={email}
				use:syncInvalidAria
			/>
			<div id="email-error" class="error-msg">
				<span role="img" aria-label="Error">!</span> Enter an email address in the format you@example.com.
			</div>
		</div>

		<PasswordInput
			autocomplete="current-password"
			errorText="Enter your password."
			bind:value={password}
		/>

		<button type="submit" disabled={submitting}>
			{submitting ? 'Signing in...' : 'Sign in'}
		</button>
	</form>

	<p class="switch-link">
		Don't have an account? <a href="/register">Create account</a>
	</p>
</section>
