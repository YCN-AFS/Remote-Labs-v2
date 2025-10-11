<style scoped>
	.course {
		@apply w-full min-h-screen flex flex-col text-gray-800;
	}
	.course__header__container {
		@apply bg-primary text-white;
	}
	.course__header {
		@apply container mx-auto p-6 py-12 w-full; 
	}
	.course__header__left {
		@apply w-full flex flex-col gap-6 lg:w-8/12;
	}
	.course__title {
		@apply text-3xl font-bold uppercase lg:text-4xl;
	}
	.course__brief {
		@apply flex flex-row divide-x;
	}
	.course__brief__title {
		@apply text-sm;
	}

	.course__main__container {
		@apply relative mx-auto p-6 py-12 container w-full flex flex-col gap-6 *:shrink-0 lg:flex-row;
	}

	.course__aside {
		@apply w-full flex flex-col gap-6 lg:w-4/12 lg:-mt-64;
	}
	.course__aside__sticky {
		@apply flex flex-col gap-6 lg:sticky lg:top-6 lg:h-fit;
	}
	.course__stats {
		@apply rounded border p-6 bg-white;
	}
	.course__thumbnail {
		@apply rounded border w-full;
	}
	.course__stats__title {
		@apply text-2xl font-bold;
	}
	.course__stats__list {
		@apply mt-6 flex flex-col gap-3;
	}

	.course__main {
		@apply w-full flex flex-col gap-6 lg:order-first lg:w-8/12;
	}
	.course__section {
		@apply rounded border p-6;
	}
	.course__section__title {
		@apply border-b pb-3 w-full text-xl font-bold uppercase lg:text-2xl;
	}
	.course__section__content {
		@apply mt-6;
	}
</style>

<template>
	<div class="app">
		<Loader v-if="isLoading" />
		
		<div class="w-full min-h-screen flex justify-center items-center" v-if="!isLoading && !course">
			<p>Bạn chưa đăng ký khoá học nào</p>
		</div>

		<div class="course" v-if="!isLoading && course">
			<div class="course__header__container">
				<header class="course__header">
					<div class="course__header__left">
						<h1 class="course__title">{{ course.displayname }}</h1>
						<div v-html="course.summary"></div>
						<div class="course__brief">
							<div class="pr-6 flex flex-col justify-around">
								<h2 class="course__brief__title">Giáo viên</h2>
								<p class="course__brief__description">-</p>
							</div>
							<div class="px-6 flex flex-col justify-around">
								<h2 class="course__brief__title">Danh mục</h2>
								<p class="course__brief__description">{{ course.category.name }}</p>
							</div>
							<div class="pl-6 flex flex-col justify-around">
								<h2 class="course__brief__title">Review</h2>
								<p class="flex items-center *:size-4 *:fill-yellow-400">
									<IconStarFull />
									<IconStarFull />
									<IconStarFull />
									<IconStarFull />
									<IconStarFull />
								</p>
							</div>
						</div>
					</div>
					<div class="course__header__right"></div>
				</header>
			</div>

			<div class="course__main__container">
				<aside class="course__aside">
					<img :src="course.courseimage" alt="course-thumbnail" class=" course__thumbnail">

					<div class="course__aside__sticky">
						<div class="course__stats">
							<h2 class="course__stats__title">Tổng quát khoá học</h2>
							<ul class="course__stats__list">
								<li class="course__stats__item">Bài giảng: {{ courseContent.length }}</li>
								<li class="course__stats__item">Thời gian bắt đầu: {{ new Date(course.startdate * 1000).toLocaleDateString('en-GB') }}</li>
								<li class="course__stats__item">Thời gian kết thúc: {{ new Date(course.enddate * 1000).toLocaleDateString('en-GB') }}</li>
								<li class="course__stats__item">Số học viên: {{ course.enrolledusercount }}</li>
								<li class="course__stats__item">Tình trạng: {{ course.complete ? 'Đã hoàn thành' : 'Chưa hoàn thành' }}</li>
								<li class="course__stats__item">Cập nhật lúc: {{ new Date(course.timemodified * 1000).toLocaleDateString('en-GB') }}</li>
							</ul>
						</div>

						<form class="rounded border p-6 flex flex-col gap-3 bg-white" @submit.prevent="registerLab">
							<h2 class="mb-3 text-2xl font-bold">Đăng ký thực hành online</h2>
							<div class="flex flex-col gap-1.5">
								<label for="schedule-date">Ngày thực hành</label>
								<input type="date" id="schedule-date" class="rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" v-model="schedule.date" required>
							</div>
							<div class="flex flex-col gap-1.5">
								<label for="schedule-starttime">Thời gian bắt đầu thực hành</label>
								<input type="time" id="schedule-starttime" class="rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" v-model="schedule.startTime" required>
							</div>
							<div class="flex flex-col gap-1.5">
								<label for="schedule-endtime">Thời gian thực hành xong</label>
								<input type="time" id="schedule-endtime" class="rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" v-model="schedule.endTime" required>
							</div>
							<button type="submit" class="mt-3 rounded px-4 py-2 flex justify-center items-center bg-primary text-white font-bold hover:saturate-50 focus:saturate-50">
								<IconSpinner v-if="formLoading" class="size-6 animate-spin" />
								<span v-if="formLoading" class="font-normal">Đang xử lý...</span>
								<span v-else>Đăng ký</span>
							</button>
						</form>

						<div class="course__stats">
							<h2 class="course__stats__title">Thông tin đăng ký thực hành</h2>
							<p v-if="!approvedSchedule">Chưa có lịch đăng ký</p>
							<ul class="course__stats__list" v-else>
								<li class="course__stats__item">Thời gian bắt đầu: {{ new Date(approvedSchedule.startTime).toLocaleString('en-GB') }}</li>
								<li class="course__stats__item">Thời gian kết thúc: {{ new Date(approvedSchedule.endTime).toLocaleString('en-GB') }}</li>
								<li class="course__stats__item">userName: {{ approvedSchedule.userName}}</li>
								<li class="course__stats__item">Mật khẩu: {{ approvedSchedule.password }}</li>
								<li class="course__stats__item">Địa chỉ Remote Desktop: tr1nh.net</li>
							</ul>
						</div>
					</div>
				</aside>

				<main class="course__main">
					<section class="course__section">
						<h2 class="course__section__title">Tổng quan</h2>
						<div class="course__section__content">
							<div v-html="course.summary"></div>
						</div>
					</section>

					<section class="course__section">
						<h2 class="course__section__title">Chương trình giảng dạy</h2>
						<div class="course__section__content">
							<p v-if="courseContent.length == 0">Chưa có</p>

							<div class="flex flex-col gap-3">
								<div class="relative" v-for="content in courseContent">
									<input type="checkbox" :id="content.id" class="hidden peer">

									<label class="border-b py-3 flex justify-between items-center" :for="content.id">
										<h3 class="text-lg font-bold lg:text-xl">{{ content.name }}</h3>
									</label>

									<label :for="content.id" class="absolute top-5 right-0 transition peer-checked:rotate-180">
										<IconChevronUp class="size-4 stroke-gray-400" />
									</label>

									<div class="mt-3 max-h-0 flex flex-col gap-3 overflow-hidden transition-all peer-checked:max-h-screen">
										<div class="flex items-center gap-6 hover:text-primary" v-for="module in content.modules">
											<img :src="module.modicon" alt="modicon" class="size-12">
											<NuxtLink :to="module.modname == 'page' ? '/page?id=' + module.contextid : '#'" class="font-bold">
												{{ module.name }}
											</NuxtLink >
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	</div>
</template>

<script setup>
	import swal from 'sweetalert2';
	import axios from 'axios';

	useHead({ title: 'Khoá học' });

	const profile = useProfileStore();
	const isLoading = ref(true);
	const course = ref(null);
	const courseContent = ref(null);
	const user = ref(null);
	const schedule = ref({
		date: new Date().toISOString().split('T')[0],
		startTime: '07:00',
		endTime: '08:00'
	});
	const formLoading = ref(false);
	const approvedSchedule = ref(null);

	async function registerLab(event) {
		if (formLoading.value) return;	
		formLoading.value = true;

		let startTime = new Date(`${schedule.value.date}T${schedule.value.startTime}`);
		let endTime = new Date(`${schedule.value.date}T${schedule.value.endTime}`);

		try {
			let response = await axios.post('https://remote-lab.tr1nh.net/api/schedule', {
				userId: user.value.id,
				email: user.value.email,
				userName: user.value.username,
				startTime: startTime.getTime(),
				endTime: endTime.getTime()
			});
			swal.fire({ icon: 'success', title: 'Thành công', text: response.data.message });
		}
		catch (error) {
			swal.fire({ icon: 'error', title: 'Lỗi', text: error.response.data.message });
		}
		finally {
			formLoading.value = false;
		}
	}

	onBeforeMount(async () => {
		// check token and redirect to login if not exist
		let token = useCookie("token").value;
		if (!token) return useRouter().replace("/login");

		try {
			user.value = await profile.getProfile();

			// get first course of user
			let courses = await moodle.callApi("core_enrol_get_users_courses", { userid: user.value.id });
			if (courses.length > 0) course.value = courses[0];
			else return await enrollCourse();

			// get course category
			let categories = await moodle.callApi("core_course_get_categories", {
				"criteria[0][key]": "id",
				"criteria[0][value]": course.value.category
			});
			if (categories.length > 0) course.value.category = categories[0];

			// get course content
			let content = await moodle.callApi("core_course_get_contents", { courseid: course.value.id });
			courseContent.value = content;

			// get schedule
			await getSchedule();
		}
		catch (error) {
			swal.fire({ icon: 'error', title: 'Lỗi', text: error.toString() });
		}
		finally {
			isLoading.value = false;
		}
	});

	onMounted(() => {
		let source = new EventSource('https://remote-lab.tr1nh.net/sse');
		source.addEventListener('message', message => {
			let data = JSON.parse(message.data);
			if (data.type != 'approved-schedule') return;

			let email = user.value.email;
			if (data.email != email) return;

			getSchedule();

			swal.fire({
				icon: 'success',
				title: 'Thành công',
				text: 'Lịch đăng ký của bạn đã được chấp nhận'
			});
		});
	});

	async function enrollCourse() {
		try {
			let response = await axios.post('https://remote-lab.tr1nh.net/api/course/enrol', { email: user.value.email });
			window.location.reload();
		}
		catch (error) {
			swal.fire({ icon: 'error', title: 'Lỗi', text: error.response.data.message });
		}
	}

	async function getSchedule() {
		try {
			let email = user.value.email;
			let url = 'https://remote-lab.tr1nh.net/api/schedule/' + email;
			let response = await axios.get(url);
			let data = response.data.data;
			if (data.length > 0) approvedSchedule.value = data[data.length - 1];
		}
		catch (error) {
			swal.fire({ icon: 'error', title: 'Lỗi', text: error.response.data.message });
		}
	}
</script>
