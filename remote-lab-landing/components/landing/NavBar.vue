<style scoped>
	.nav__container {
		@apply sticky z-50 top-0 p-6 pb-0;
	}
	.nav {
		@apply relative shadow-md rounded-md border border-white px-6 py-3 flex justify-between items-center bg-white/70 backdrop-blur;
	}
	.nav__logo {
		@apply w-12;
	}
	.nav__menu {
		@apply absolute top-full right-3 shadow rounded-lg p-6 hidden flex-col gap-3 bg-white -translate-y-3 transition-all
			lg:relative lg:shadow-none lg:p-0 lg:flex lg:flex-row lg:bg-transparent lg:translate-y-0;
	}
	.nav__item {
		@apply relative px-3 py-1.5 font-bold transition
			hover:text-primary
			after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-primary after:transition-all
			lg:hover:text-inherit
			lg:hover:after:w-full;
	}
</style>

<template>
		<div class="nav__container">
			<nav class="nav">
				<input type="checkbox" id="show-menu" class="hidden peer/show-menu">

				<img src="~/assets/images/logo.png" alt="brand-logo" class="nav__logo">

				<label for="show-menu" class="fill-gray-700 peer-checked/show-menu:fill-primary lg:hidden"><IconBars class="size-6"/></label>

				<ul class="nav__menu peer-checked/show-menu:flex">
					<li class="nav__item nav__item--actived"><a href="/">Trang chủ</a></li>
					<li class="nav__item"><NuxtLink to="/posts">Blog</NuxtLink></li>
					<li class="nav__item"><a href="#pricing">Đăng ký</a></li>
					<li class="nav__item"><NuxtLink to="/login">Đăng nhập</NuxtLink></li>
				</ul>
			</nav>
		</div>
</template>
