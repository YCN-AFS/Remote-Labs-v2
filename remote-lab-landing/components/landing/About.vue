<style scoped>
	.about {
		@apply relative mx-auto px-6 py-12 container w-full flex flex-col lg:flex-row;
	}
	.about__decor {
		@apply -z-10 absolute inset-0 bg-gray-100 [clip-path:polygon(75%_0%,100%_0%,100%_30%,65%_100%,30%_100%)];
	}
	.about__left {
		@apply w-full flex flex-col gap-3 text-center lg:w-1/2 lg:text-left;
	}
	.about__right {
		@apply w-full hidden justify-center items-start lg:w-1/2 lg:flex;
	}
	.about__title {
		@apply font-bold text-3xl text-primary uppercase lg:text-4xl;
	}
	.about__description {
	}
	.about__buttons {
		@apply mt-3 flex gap-3 justify-center lg:justify-start;
	}
	.about__button {
		@apply rounded-md px-6 py-3 bg-primary text-white hover:saturate-50;
	}
	.about__quote {
		@apply text-primary;
	}
	.about__image--1 {
		@apply z-20 shadow-md rounded border max-w-64 w-full translate-x-6 translate-y-6;
	}
	.about__image--2 {
		@apply z-10 shadow-md rounded border max-w-64 w-full -translate-x-6;
	}
</style>

<template>
	<section class="about" id="about">
		<div class="about__decor"></div>

		<div class="about__left">
			<h2 class="about__title">Kết Nối Học Tập Mọi Nơi, Mọi Lúc</h2>

			<p class="about__description">
				Remote Lab là giải pháp quản lý học tập trực tuyến hiện đại, được xây dựng để tổ chức,
				quản lý, theo dõi và cung cấp tài liệu, bài giảng chuyên ngành kỹ thuật.
				Remote Lab tích hợp đầy đủ các chức năng như đăng ký tài khoản, đăng ký lịch học,
				truy cập tài liệu liên quan, cung cấp video bài giảng và giám sát hoạt động
				của thiết bị thí nghiệm từ xa. Ngoài ra, Remote Lab tạo điều kiện cho sinh viên
				thực hành với thiết bị thực tế thông qua quyền truy cập điều khiển từ xa, giúp
				loại bỏ mọi giới hạn về khoảng cách địa lý. Giải pháp này cũng cung cấp diễn đàn
				để thảo luận, chia sẻ kinh nghiệm học tập, mang đến trải nghiệm giáo dục
				kỹ thuật số toàn diện và hiệu quả.
			</p>

			<div class="about__buttons">
				<button class="about__button">IoT</button>
				<button class="about__button">Lập trình nhúng</button>
			</div>

			<p class="about__quote">
				Thực hành từ xa,
				Phòng Lab ảo,
				Học tập không giới hạn địa lý,
				Phòng thí nghiệm ảo,
				Truy cập điều khiển từ xa
			</p>
		</div>

		<div class="about__right">
			<img src="~/assets/images/mobile-app-1.jpg" alt="about-image-1" class="about__image--1">
			<img src="~/assets/images/mobile-app-2.jpg" alt="about-image-2" class="about__image--2">
		</div>
	</section>
</template>
