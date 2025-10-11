<template>
	<div class="p-6 w-full min-h-screen" v-html="pageContent">
	</div>
</template>

<script setup>
	import axios from 'axios';

	const route = useRoute();
	const moduleId = computed(() => route.query.id);
	const pageContent = ref('');

	onBeforeMount(async () => {
		let token = useCookie('token').value;
		let url = `https://lms-remote-lab.s4h.edu.vn/webservice/pluginfile.php/${moduleId.value}/mod_page/content/index.html?forcedownload=1&token=${token}`;
		let response = await axios.get(url);
		pageContent.value = response.data;
	});
</script>
