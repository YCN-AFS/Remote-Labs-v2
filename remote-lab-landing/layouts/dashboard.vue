<style scoped>
	.app {
		@apply relative w-full h-screen flex overflow-x-hidden bg-gray-100 text-gray-700 fill-gray-700;
	}

	.drawer {
		@apply z-50 shrink-0 w-80 h-full bg-primary text-white;
	}
	.drawer__backdrop {
		@apply absolute inset-0 z-50 bg-transparent pointer-events-none transition-all peer-checked/drawer:bg-black/50 lg:hidden;
	}
	.drawer__container {
		@apply absolute inset-0 z-50 -translate-x-full flex overflow-hidden transition-all delay-75
			peer-checked/drawer:translate-x-0
			lg:relative lg:translate-x-0 lg:shrink-0 lg:w-0 lg:peer-checked/drawer:w-80;
	}
	.drawer__switch {
		@apply size-full lg:hidden;
	}
	.drawer__title {
		@apply p-6 text-2xl font-bold;
	}
	.drawer__items {
		@apply px-3 py-1.5 flex flex-col;
	}
	.drawer__item {
		@apply rounded p-3 flex items-center gap-3 hover:bg-white/20;
	}
	.drawer__icon {
		@apply size-5 fill-white;
	}
	.drawer__item--head {
		@apply mt-6 uppercase text-xs font-bold hover:bg-transparent;
	}

	.top-bar {
		@apply border-b shrink-0 w-full p-3 flex items-center bg-white;
	}
	.top-bar__button {
		@apply rounded-full p-3 cursor-pointer hover:bg-gray-200;
	}
	.top-bar__title {
		@apply -mt-0.5 ml-3 text-xl font-bold;
	}
</style>

<template>
	<div class="app">
		<!-- drawer -->
		<input type="checkbox" id="toggle-drawer" class="hidden peer/drawer">
		<div class="drawer__backdrop"></div>
		<div class="drawer__container">
			<div class="drawer">
				<h1 class="drawer__title">Remote Lab</h1>

				<div class="drawer__items">
					<span class="drawer__item drawer__item--head">Menu</span>
					<NuxtLink to="/dashboard/payment" class="drawer__item">
						<IconDolarSign class="drawer__icon" />
						<span>Thanh toán khoá học</span>
					</NuxtLink>
					<NuxtLink to="/dashboard/schedule" class="drawer__item">
						<IconCalendarDays class="drawer__icon" />
						<span>Lịch đăng ký thực hành</span>
					</NuxtLink>
					<NuxtLink to="/dashboard/computer" class="drawer__item">
						<IconComputer class="drawer__icon" />
						<span>PC thực hành</span>
					</NuxtLink>
					<a href="javascript:void(0)" @click="signOut" class="drawer__item">
						<IconRightFromBracket class="drawer__icon" />
						<span>Đăng xuất</span>
					</a>
				</div>

				<div class="drawer__items">
					<span class="drawer__item drawer__item--head">Trợ giúp</span>
					<a href="#" class="drawer__item">
						<IconCircleQuestion class="drawer__icon" />
						<span>FAQ</span>
					</a>
					<a href="#" class="drawer__item">
						<IconAddressCard class="drawer__icon" />
						<span>Liên hệ</span>
					</a>
				</div>
			</div>
			<label for="toggle-drawer" class="drawer__switch"></label>
		</div>

		<!-- content -->
		<div class="w-full flex flex-col">
			<div class="top-bar">
				<label for="toggle-drawer" class="top-bar__button">
					<IconBars class="size-5" />
				</label>
				<h1 class="top-bar__title">{{ title }}</h1>
			</div>

			<div class="h-full overflow-y-scroll">
				<slot></slot>
			</div>
		</div>
	</div>
</template>

<script setup>
	const route = useRoute();
	const title = computed(() => route.meta.title);

	onBeforeMount(() => {
		let token = useCookie('access_token').value;
		if (!token) useRouter().push('/dashboard/login');
	});

	function signOut() {
		console.log('sign out');
		useCookie('access_token').value = '';
		useCookie('user').value = '';
		useRouter().push('/dashboard/');
	}
</script>
