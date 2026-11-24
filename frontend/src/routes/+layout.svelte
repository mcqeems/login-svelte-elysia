<script lang="ts">
  import "../app.css";
  import favicon from "#lib/assets/favicon.svg";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>Tugas 12 Auth</title>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="topbar">
  <a class="brand" href="/">Tugas 12 Auth</a>
  <nav class="nav-links" aria-label="Authentication">
    <a href="/login">Login</a>
    <a href="/register">Register</a>
  </nav>
</header>

<main>
  {@render children()}
</main>
