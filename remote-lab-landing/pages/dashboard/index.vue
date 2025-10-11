<template>
	<div class=""></div>
</template>

<script setup>
	useHead({ title: 'Dashboard' });
	definePageMeta({ title: 'Dashboard' });

	onBeforeMount(() => {
		let token = useCookie('access_token').value;
		if (!token) useRouter().push('/dashboard/login');
		else useRouter().push('/dashboard/schedule');
	});
</script>
