<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiFetch, type User } from "#lib/api.ts";
  import { syncInvalidAria } from "#lib/formAria.ts";
  import PasswordInput from "#lib/PasswordInput.svelte";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let submitting = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    submitting = true;

    try {
      await apiFetch<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await goto("/");
    } catch (err) {
      error = err instanceof Error ? err.message : "Registration failed.";
    } finally {
      submitting = false;
    }
  }
</script>

<section class="card">
  <h1>Create account</h1>

  {#if error}
    <div class="alert" role="alert">{error}</div>
  {/if}

  <form method="POST" onsubmit={handleSubmit}>
    <div class="field">
      <label for="name">Full name</label>
      <input
        id="name"
        name="name"
        type="text"
        autocomplete="name"
        maxlength="100"
        enterkeyhint="next"
        required
        data-error="name-error"
        bind:value={name}
        use:syncInvalidAria
      />
      <div id="name-error" class="error-msg">
        <span role="img" aria-label="Error">!</span> Enter your name.
      </div>
    </div>

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
        <span role="img" aria-label="Error">!</span> Enter an email address in the
        format you@example.com.
      </div>
    </div>

    <PasswordInput
      autocomplete="new-password"
      minlength={6}
      hint="At least 6 characters."
      errorText="Password must be at least 6 characters."
      bind:value={password}
    />

    <button type="submit" disabled={submitting}>
      {submitting ? "Creating account..." : "Create account"}
    </button>
  </form>

  <p class="switch-link">
    Already have an account? <a href="/login">Sign in</a>
  </p>
</section>
