<template>
	<div class="p-6 w-full min-h-screen" v-html="pageContent">
	</div>
</template>

<script setup>
	const route = useRoute();
	const moduleId = computed(() => route.query.id);
	const pageContent = ref('');

	onBeforeMount(async () => {
		// Mock page content since Moodle is disabled
		pageContent.value = `
			<h1>Trang nội dung khóa học</h1>
			<p>Module ID: ${moduleId.value}</p>
			<p>Nội dung này sẽ được hiển thị khi có dữ liệu thực tế từ hệ thống quản lý khóa học.</p>
			<div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3>Thông báo</h3>
				<p>Hệ thống đang trong quá trình chuyển đổi từ Moodle sang hệ thống quản lý nội bộ. Nội dung khóa học sẽ được cập nhật sớm nhất.</p>
			</div>
		`;
	});
</script>
