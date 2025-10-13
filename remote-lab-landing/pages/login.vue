<template>
	<div class="w-full min-h-screen flex flex-col items-center bg-gray-100 text-gray-700">
		<!-- top navigation -->
		<nav class="sticky top-0 shadow p-6 w-full bg-white lg:p-3">
			<div class="mx-auto container flex justify-center items-center gap-3 lg:justify-between">
				<a href="#" class="font-bold">Remote Lab</a>
				<button class="ml-auto rounded px-6 py-2 hidden text-gray-300 lg:block" disabled>Đăng nhập</button>
				<button class="rounded px-6 py-2 hidden bg-primary text-white hover:saturate-50 lg:block">Đăng ký</button>
			</div>
		</nav>

		<!-- login form -->
		<div class="p-6 pt-12 max-w-lg w-full">
			<form @submit.prevent="login" class="shadow rounded p-10 flex flex-col gap-3 bg-white">
				<h1 class="mb-3 text-2xl font-bold">Đăng nhập</h1>

				<div class="flex flex-col gap-1.5 group">
					<label for="email" class="text-sm text-gray-600 group-focus-within:font-bold">Email</label>
					<input
						v-model="email"
						id="email" type="text" placeholder="Email" required
						class="rounded px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<div class="flex flex-col gap-1.5 group">
					<label for="password" class="text-sm text-gray-600 group-focus-within:font-bold">Mật khẩu</label>
					<input
						v-model="password"
						id="password" type="password" placeholder="*******" required
						class="rounded px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<NuxtLink to="#" class="text-primary hover:underline">Quên mật khẩu?</NuxtLink>

				<button class="mt-6 rounded px-4 py-2 flex justify-center items-center bg-primary text-white font-bold hover:saturate-50 focus:saturate-50">
					<IconSpinner v-if="isLoading" class="size-6 animate-spin" />
					<span v-if="isLoading" class="font-normal">Đang xử lý...</span>
					<span v-else>Đăng nhập</span>
				</button>
			</form>
		</div>
		<!-- end login form -->

		<!-- footer -->
		<footer class="mt-auto w-full">
			<div class="mx-auto p-6 container w-full flex flex-col justify-between items-center lg:flex-row">
				<p class="order-last">
					&copy; Copyright 2024 By LHU
				</p>

				<div class="hidden gap-3 lg:flex">
					<a href="#" class="hover:text-primary">About</a>
					<a href="#" class="hover:text-primary">Help</a>
					<a href="#" class="hover:text-primary">Terms</a>
					<a href="#" class="hover:text-primary">Privacy</a>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup>
	import Swal from 'sweetalert2';

	definePageMeta({
		title: 'Login',
		layout: 'default'
	});

	const profile = useProfileStore();
	const router = useRouter();
	const isLoading = ref(false);
	const email = ref('');
	const password = ref('');

	async function login() {
		if (isLoading.value) return;
		isLoading.value = true;

		try {
			const token = await profile.login(email.value, password.value);
			console.log('✅ Login successful, navigating to /course');
			console.log('🔍 Token received:', token);
			console.log('🔍 Navigating to /course...');
			
			// Try different navigation methods
			try {
				await navigateTo('/course', { external: true });
			} catch (navError) {
				console.log('🔍 navigateTo failed, trying router.push...');
				await router.push('/course');
			}
		} catch (error) {
			console.error('❌ Login error:', error);
			const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
			Swal.fire('Lỗi', errorMessage, 'error');
		} finally {
			isLoading.value = false;
		}
	}
</script>
