<script lang="ts">
	import { syncInvalidAria } from '#lib/formAria.ts';

	let {
		id = 'password',
		name = 'password',
		label = 'Password',
		autocomplete,
		minlength,
		hint,
		errorText,
		value = $bindable('')
	}: {
		id?: string;
		name?: string;
		label?: string;
		autocomplete: 'current-password' | 'new-password';
		minlength?: number;
		hint?: string;
		errorText: string;
		value: string;
	} = $props();

	let showPassword = $state(false);
	const hintId = $derived(`${id}-hint`);
	const errorId = $derived(`${id}-error`);
</script>

<div class="field">
	<label for={id}>{label}</label>
	{#if hint}
		<span id={hintId} class="hint">{hint}</span>
	{/if}
	<div class="password-row">
		<input
			{id}
			{name}
			type={showPassword ? 'text' : 'password'}
			{autocomplete}
			{minlength}
			enterkeyhint="done"
			required
			aria-describedby={hint ? hintId : undefined}
			data-error={errorId}
			bind:value
			use:syncInvalidAria
		/>
		<button
			type="button"
			class="btn-secondary"
			aria-pressed={showPassword}
			aria-label={showPassword ? 'Hide password' : 'Show password'}
			onclick={() => (showPassword = !showPassword)}
		>
			{showPassword ? 'Hide' : 'Show'}
		</button>
	</div>
	<div id={errorId} class="error-msg">
		<span role="img" aria-label="Error">!</span> {errorText}
	</div>
</div>
