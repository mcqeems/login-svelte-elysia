import type { Action } from 'svelte/action';

function setErrorDescribedBy(el: HTMLInputElement, show: boolean) {
	const errorId = el.dataset.error;
	if (!errorId) return;

	const ids = (el.getAttribute('aria-describedby') ?? '')
		.split(/\s+/)
		.filter((id) => id && id !== errorId);

	if (show) ids.push(errorId);

	if (ids.length) {
		el.setAttribute('aria-describedby', ids.join(' '));
	} else {
		el.removeAttribute('aria-describedby');
	}
}

export const syncInvalidAria: Action<HTMLInputElement> = (node) => {
	const sync = () => {
		const invalid = node.matches(':user-invalid');
		node.setAttribute('aria-invalid', invalid ? 'true' : 'false');
		setErrorDescribedBy(node, invalid);
	};

	node.setAttribute('aria-invalid', 'false');

	const onInput = () => {
		if (node.getAttribute('aria-invalid') === 'true') sync();
	};

	node.addEventListener('blur', sync);
	node.addEventListener('invalid', sync);
	node.addEventListener('input', onInput);

	return {
		destroy() {
			node.removeEventListener('blur', sync);
			node.removeEventListener('invalid', sync);
			node.removeEventListener('input', onInput);
		}
	};
};
