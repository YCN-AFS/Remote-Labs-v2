<template>
	<div class="w-full min-h-screen flex flex-col text-gray-700">
		<LandingNavBar />

		<div class="p-12 bg-bottom bg-cover bg-primary bg-[url('~/assets/images/footer.png')] text-white">
			<div class="mx-auto container w-full">
				<h2 class="text-2xl font-bold md:text-3xl">Blog</h2>
			</div>
		</div>

		<Loader v-if="isLoading" />

		<div v-else class="mt-6 mx-auto p-3 container flex flex-col gap-3 md:p-6 md:gap-6">
			<div class="flex gap-3 md:gap-6" v-for="(post, i) in posts">
				<img
					v-if="post._embedded['wp:featuredmedia']"
					:src="post._embedded['wp:featuredmedia'][0].source_url"
					:alt="post._embedded['wp:featuredmedia'][0].slug"
					class="w-full rounded-lg border aspect-square w-full object-cover lg:w-1/4">
				<div v-else class="w-full rounded-lg border aspect-square w-full object-cover bg-gray-100 lg:w-1/4"></div>

				<div class="w-full flex flex-col gap-1.5">
					<h2 class="text-xl font-bold md:text-2xl">
						<a :href="post.link" class="hover:underline hover:text-primary">
							{{ post.title.rendered }}
						</a>
					</h2>
					<div class="flex flex-col md:flex-row md:items-center md:gap-3">
						<p>
							<span class="mr-1.5 text-sm text-gray-500">Bởi</span>
							<a class="text-gray-700 font-bold hover:underline hover:text-primary" :href="post._embedded.author[0].link">
								{{ post._embedded.author[0].name }}
							</a>
						</p>
						<span class="text-sm text-gray-500">Lúc {{ new Date(post.date).toLocaleString("en-GB") }}</span>
					</div>
					<p v-html="post.excerpt.rendered" class="hidden md:block"></p>
					<div class="mt-3">
						<a :href="post.link" class="rounded px-3 py-2 bg-primary text-center text-white hover:saturate-50">Đọc thêm</a>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-12 border-t overflow-hidden">
			<LandingFooter />
		</div>
	</div>
</template>

<script setup>
	import axios from 'axios';

	const isLoading = ref(true);
	const posts = ref([]);

	onBeforeMount(async () => {
		let url = 'https://share4happy.com/wp-json/wp/v2/posts?categories=203&_embed';
		let response = await axios.get(url);
		posts.value = response.data;

		isLoading.value = false;
	});
</script>
