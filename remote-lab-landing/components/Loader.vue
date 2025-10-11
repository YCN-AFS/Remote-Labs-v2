<style scoped>
	#message {
		@apply relative font-bold text-2xl text-gray-700;
	}

	#message::after {
		@apply absolute pl-0.5 whitespace-nowrap;
		animation: loading 1s infinite;
		content: "";
	}

	@keyframes loading {
		0% {
			content: "";
		}
		30% {
			content: ".";
		}
		60% {
			content: "..";
		}
		90% {
			content: "...";
		}
	}
</style>

<template>
	<div class="w-full h-screen flex justify-center items-center bg-white">
		<p id="message">{{ message }}</p>
	</div>
</template>

<script setup>
	const props = defineProps({
		message: {
			type: String,
			default: "Đang tải",
		},
	});
</script>
